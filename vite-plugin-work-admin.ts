/**
 * DEV-ONLY local endpoints for the Work admin (admin/index.html).
 * Registered only by `vite serve` (apply: "serve") and only when the dev server is bound to localhost.
 * Writes: public/work/** (uploads) and src/data/work.json (+ backups in .work-backups/).
 */
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";
import { Transform, Writable } from "node:stream";

const run = promisify(execFile);
const API = "/__work";
const MB = 1024 * 1024;
const LIMIT = { image: 25 * MB, video: 300 * MB, json: 2 * MB };
const IMG_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".tif",
  ".tiff",
]);
const DIRS = ["posts", "print", "videos", "projects"] as const;
type Cat = (typeof DIRS)[number];
const RATIOS = ["portrait", "landscape", "square"] as const;
type Ratio = (typeof RATIOS)[number];
const MODES = ["crop", "fit", "keep"] as const;
type Mode = (typeof MODES)[number]; // crop: fill and cut. fit: whole image on a blurred backdrop. keep: original shape.
const PRINT: Record<Ratio, [number, number]> = {
  portrait: [1240, 1754], // A4 at about 150 dpi
  landscape: [1754, 1240],
  square: [1500, 1500],
};
// Output size above which the admin warns, per category (bytes).
const MAX_OUT: Record<Cat, number> = {
  posts: 450 * 1024,
  print: 900 * 1024,
  videos: 200 * 1024,
  projects: 500 * 1024,
};
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const BACKUPS_KEPT = 30;

type Ctx = { workRoot: string; jsonFile: string; backupDir: string };
type Obj = Record<string, unknown>;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
function fail(message: string, status = 422): never {
  throw new HttpError(status, message);
}
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const kb = (n: number) =>
  n < MB ? `${Math.round(n / 1024)} KB` : `${(n / MB).toFixed(1)} MB`;

/* ---------- safety helpers ---------- */

function safeJoin(root: string, rel: string): string {
  if (rel.includes("\0")) fail("Bad path.", 400);
  const p = path.resolve(root, rel);
  if (p !== root && !p.startsWith(root + path.sep))
    fail("Path escapes public/work.", 400);
  return p;
}
function filePath(c: Ctx, urlPath: string): string {
  if (!urlPath.startsWith("/work/")) fail("Path must start with /work/.", 400);
  return safeJoin(
    c.workRoot,
    decodeURIComponent(urlPath.slice("/work/".length)),
  );
}
function slugify(name: string): string {
  const base = path.parse(name).name;
  return (
    base
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file"
  );
}
function guard(req: IncomingMessage) {
  const addr = req.socket.remoteAddress ?? "";
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(addr))
    fail("Local connections only.", 403);
  const host = (req.headers.host ?? "").toLowerCase().replace(/:\d+$/, "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host))
    fail("Unexpected Host header.", 403); // DNS rebinding
  if (req.headers["x-work-admin"] !== "1") fail("Missing admin header.", 403); // forces a CORS preflight for other sites
}

/* ---------- io helpers ---------- */

const limiter = (max: number) => {
  let n = 0;
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      n += chunk.length;
      if (n > max)
        cb(
          new HttpError(
            413,
            `File is over the ${Math.round(max / MB)} MB limit.`,
          ),
        );
      else cb(null, chunk);
    },
  });
};
async function readBuffer(req: IncomingMessage, max: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  await pipeline(
    req,
    limiter(max),
    new Writable({
      write(c: Buffer, _e, cb) {
        chunks.push(c);
        cb();
      },
    }),
  );
  return Buffer.concat(chunks);
}
const exists = (p: string) =>
  fs.access(p).then(
    () => true,
    () => false,
  );
async function uniqueBase(dir: string, slug: string, exts: string[]) {
  for (let i = 1; ; i++) {
    const base = i === 1 ? slug : `${slug}-${i}`;
    const taken = await Promise.all(
      exts.map((e) => exists(path.join(dir, base + e))),
    );
    if (!taken.some(Boolean)) return base;
  }
}
async function writeAtomic(file: string, data: Buffer | string) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}
// One write at a time, so two uploads can never pick the same filename.
let chain: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const p = chain.then(fn);
  chain = p.catch(() => undefined);
  return p;
};
function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.setHeader("cache-control", "no-store");
  if (status === 413) res.setHeader("connection", "close");
  res.end(JSON.stringify(body));
}

/* ---------- images ---------- */

function spec(cat: Cat, ratio: Ratio) {
  switch (cat) {
    case "posts":
      return { w: 1080, h: 1350, q: 82, pos: "centre" };
    case "print": {
      const [w, h] = PRINT[ratio];
      return { w, h, q: 84, pos: "centre" };
    }
    case "videos":
      return { w: 1280, h: 720, q: 80, pos: "centre" };
    case "projects":
      return { w: 1600, h: 1000, q: 82, pos: "top" }; // the site crops projects from the top
  }
}

async function processImage(
  input: Buffer,
  cat: Cat,
  ratio?: Ratio,
  mode: Mode = "crop",
) {
  const { default: sharp } = await import("sharp");
  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    fail("That file is not a readable image.", 415);
  }
  if (!meta.width || !meta.height) fail("Could not read the image size.", 415);
  const swap = (meta.orientation ?? 1) >= 5;
  const sw = swap ? meta.height : meta.width;
  const sh = swap ? meta.width : meta.height;
  const r: Ratio =
    cat === "print"
      ? (ratio ??
        (sw / sh > 1.15 ? "landscape" : sw / sh < 0.87 ? "portrait" : "square"))
      : "portrait";
  const s = spec(cat, r);
  const base = sharp(input).rotate();
  const webp = { quality: s.q, effort: 5 };
  let out: Buffer;
  if (mode === "crop") {
    out = await base
      .clone()
      .resize(s.w, s.h, { fit: "cover", position: s.pos })
      .webp(webp)
      .toBuffer();
  } else if (mode === "keep") {
    out = await base
      .clone()
      .resize(s.w, s.h, { fit: "inside" })
      .webp(webp)
      .toBuffer();
  } else {
    const fg = await base
      .clone()
      .resize(s.w, s.h, { fit: "inside" })
      .toBuffer();
    const bg = await base
      .clone()
      .resize(s.w, s.h, { fit: "cover" })
      .blur(40)
      .modulate({ brightness: 0.7 })
      .toBuffer();
    out = await sharp(bg)
      .composite([{ input: fg, gravity: "centre" }])
      .webp(webp)
      .toBuffer();
  }
  const warnings: string[] = [];
  const differs = Math.abs(sw / sh / (s.w / s.h) - 1) > 0.02;
  if (differs && mode === "crop")
    warnings.push(`Source is ${sw}×${sh}; cropped to ${s.w}×${s.h}.`);
  if (differs && mode === "fit")
    warnings.push(`Whole image kept (${sw}×${sh}) on a blurred backdrop.`);
  if (sw < s.w * 0.9 || sh < s.h * 0.9)
    warnings.push(`Source is smaller than ${s.w}×${s.h}, so it may look soft.`);
  if (out.length > MAX_OUT[cat])
    warnings.push(
      `Output is ${kb(out.length)}, above the ${kb(MAX_OUT[cat])} target.`,
    );
  return { out, sw, sh, ratio: r, warnings };
}

/* ---------- ffmpeg ---------- */

let ffmpegOk: Promise<boolean> | undefined;
const hasFfmpeg = () =>
  (ffmpegOk ??= run(FFMPEG, ["-version"]).then(
    () => true,
    () => false,
  ));

function fmtDuration(total: number) {
  const t = Math.round(total);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
async function grabFrame(file: string, dir: string) {
  let duration: string | undefined;
  for (const ss of ["1", "0"]) {
    const out = path.join(dir, `frame-${ss}.png`);
    try {
      const { stderr } = await run(
        FFMPEG,
        [
          "-hide_banner",
          "-nostdin",
          "-y",
          "-ss",
          ss,
          "-i",
          file,
          "-frames:v",
          "1",
          out,
        ],
        {
          timeout: 60_000,
          maxBuffer: 4 * MB,
        },
      );
      const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
      if (m && !duration)
        duration = fmtDuration(+m[1] * 3600 + +m[2] * 60 + +m[3]);
      if (await exists(out)) return { png: await fs.readFile(out), duration };
    } catch {
      /* try the next seek position */
    }
  }
  return { png: null, duration };
}

/* ---------- endpoints ---------- */

async function uploadVideo(c: Ctx, req: IncomingMessage, name: string) {
  const dir = safeJoin(c.workRoot, "videos");
  await fs.mkdir(dir, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "work-admin-"));
  try {
    const tmp = path.join(tmpDir, "in.mp4");
    await pipeline(req, limiter(LIMIT.video), createWriteStream(tmp));
    const fh = await fs.open(tmp, "r");
    const head = Buffer.alloc(12);
    await fh.read(head, 0, 12, 0);
    await fh.close();
    if (head.subarray(4, 8).toString("latin1") !== "ftyp")
      fail("That file is not a valid MP4.", 415);
    const size = (await fs.stat(tmp)).size;
    const ffmpeg = await hasFfmpeg();
    const probe = ffmpeg ? await grabFrame(tmp, tmpDir) : null;
    return await serial(async () => {
      const base = await uniqueBase(dir, slugify(name), [".mp4", ".webp"]);
      await fs.copyFile(tmp, path.join(dir, `${base}.mp4`));
      const res: Obj & { warnings: string[] } = {
        src: `/work/videos/${base}.mp4`,
        bytesBefore: size,
        bytesAfter: size, // mp4 is stored as-is
        ffmpeg,
        warnings: [],
      };
      if (probe?.duration) res.duration = probe.duration;
      if (probe?.png) {
        const t = await processImage(probe.png, "videos");
        await writeAtomic(path.join(dir, `${base}.webp`), t.out);
        res.thumbnail = `/work/videos/${base}.webp`;
        res.thumbBytes = t.out.length;
      } else {
        res.warnings.push(
          ffmpeg
            ? "ffmpeg could not read a frame. Add a thumbnail by hand."
            : "ffmpeg not found. Add a thumbnail and duration by hand.",
        );
      }
      if (size > 50 * MB)
        res.warnings.push(
          `Video is ${kb(size)} and ships with the site. Consider compressing it first.`,
        );
      return res;
    });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function upload(c: Ctx, req: IncomingMessage, q: URLSearchParams) {
  const cat = q.get("category") ?? "";
  if (!(DIRS as readonly string[]).includes(cat))
    fail("Unknown category.", 400);
  const category = cat as Cat;
  const name = q.get("name") ?? "file";
  const ext = path.extname(name).toLowerCase();
  const ratioQ = q.get("ratio") ?? "";
  const ratio = (RATIOS as readonly string[]).includes(ratioQ)
    ? (ratioQ as Ratio)
    : undefined;
  const mode = (MODES as readonly string[]).includes(q.get("mode") ?? "")
    ? (q.get("mode") as Mode)
    : "crop";
  if (q.get("kind") === "video") {
    if (category !== "videos") fail("Videos go in the videos category.", 400);
    if (ext !== ".mp4") fail("Only .mp4 videos are accepted.", 415);
    return uploadVideo(c, req, name);
  }
  if (!IMG_EXT.has(ext))
    fail("Unsupported file type. Use JPG, PNG, WebP, AVIF, GIF or TIFF.", 415);
  const buf = await readBuffer(req, LIMIT.image);
  const dir = safeJoin(c.workRoot, category);
  await fs.mkdir(dir, { recursive: true });
  return serial(async () => {
    const r = await processImage(buf, category, ratio, mode);
    const base = await uniqueBase(dir, slugify(name), [".webp"]);
    await writeAtomic(path.join(dir, `${base}.webp`), r.out);
    return {
      path: `/work/${category}/${base}.webp`,
      bytesBefore: buf.length,
      bytesAfter: r.out.length,
      sourceWidth: r.sw,
      sourceHeight: r.sh,
      ratio: r.ratio,
      warnings: r.warnings,
    };
  });
}

// Re-crop an already stored image for another category (posts <-> print).
async function convert(c: Ctx, body: unknown) {
  if (!isObj(body)) fail("Bad request.", 400);
  const cat = String(body.category);
  if (cat !== "posts" && cat !== "print")
    fail("Can only convert to posts or print.", 400);
  const src = String(body.src ?? "");
  const file = filePath(c, src);
  if (!/\.(webp|jpe?g|png)$/i.test(file)) fail("Can only convert images.", 400);
  const buf = await fs
    .readFile(file)
    .catch(() => fail("Source file not found.", 404));
  const ratio = (RATIOS as readonly string[]).includes(String(body.ratio))
    ? (body.ratio as Ratio)
    : undefined;
  const mode = (MODES as readonly string[]).includes(String(body.mode))
    ? (body.mode as Mode)
    : "crop";
  const dir = safeJoin(c.workRoot, cat);
  await fs.mkdir(dir, { recursive: true });
  return serial(async () => {
    const r = await processImage(buf, cat, ratio, mode);
    const base = await uniqueBase(dir, slugify(path.basename(file)), [".webp"]);
    await writeAtomic(path.join(dir, `${base}.webp`), r.out);
    return {
      path: `/work/${cat}/${base}.webp`,
      bytesBefore: buf.length,
      bytesAfter: r.out.length,
      ratio: r.ratio,
      warnings: r.warnings,
    };
  });
}

/* ---------- work.json ---------- */

const MEDIA =
  /^\/work\/(posts|print|videos|projects)\/[a-z0-9][a-z0-9._-]*\.(webp|mp4)$/;
function text(
  v: unknown,
  name: string,
  req = false,
  max = 300,
): string | undefined {
  if (v === undefined || v === null)
    return req ? fail(`${name} is required.`) : undefined;
  if (typeof v !== "string") fail(`${name} must be text.`);
  const t = v.trim();
  if (!t) return req ? fail(`${name} is required.`) : undefined;
  if (t.length > max) fail(`${name} is too long.`);
  return t;
}
function link(v: unknown, name: string, req = false) {
  const t = text(v, name, req, 500);
  if (t && !/^https?:\/\//i.test(t))
    fail(`${name} must start with http:// or https://.`);
  return t;
}
function media(v: unknown, name: string, req = false) {
  const t = text(v, name, req, 200);
  if (t && !MEDIA.test(t)) fail(`${name} must be a file under /work/.`);
  return t;
}
function tagList(v: unknown, name: string): string[] {
  if (!Array.isArray(v) || v.length > 20)
    fail(`${name} must be a list of up to 20 tags.`);
  return [
    ...new Set(
      v.map((x) => text(x, name, false, 40)).filter((x): x is string => !!x),
    ),
  ];
}
const compact = (o: Obj) =>
  Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined));

function normalize(raw: unknown) {
  if (!isObj(raw)) fail("Body must be an object.");
  const list = (k: string) => {
    const a = raw[k];
    if (!Array.isArray(a) || a.length > 500)
      fail(`${k} must be a list of up to 500 items.`);
    return a.map((x, i) =>
      isObj(x) ? x : fail(`${k}[${i + 1}] must be an object.`),
    );
  };
  const L = (k: string, i: number, f: string) => `${k}[${i + 1}].${f}`;
  return {
    posters: list("posters").map((p, i) =>
      compact({
        title: text(p.title, L("posters", i, "title"), true),
        image: media(p.image, L("posters", i, "image")),
        client: text(p.client, L("posters", i, "client")),
      }),
    ),
    prints: list("prints").map((p, i) => {
      const ratio = p.ratio === "" ? undefined : p.ratio;
      if (
        ratio !== undefined &&
        !(RATIOS as readonly unknown[]).includes(ratio)
      )
        fail(`${L("prints", i, "ratio")} is not valid.`);
      return compact({
        title: text(p.title, L("prints", i, "title"), true),
        image: media(p.image, L("prints", i, "image"), true),
        type: text(p.type, L("prints", i, "type"), true),
        size: text(p.size, L("prints", i, "size")),
        ratio,
      });
    }),
    videos: list("videos").map((p, i) => {
      const src = media(p.src, L("videos", i, "src"));
      const href = link(p.href, L("videos", i, "href"));
      if (!src && !href) fail(`videos[${i + 1}] needs a video file or a link.`);
      return compact({
        title: text(p.title, L("videos", i, "title"), true),
        thumbnail: media(p.thumbnail, L("videos", i, "thumbnail"), true),
        duration: text(p.duration, L("videos", i, "duration"), false, 12),
        meta: text(p.meta, L("videos", i, "meta")),
        src,
        href,
      });
    }),
    projects: list("projects").map((p, i) =>
      compact({
        title: text(p.title, L("projects", i, "title"), true),
        description: text(
          p.description,
          L("projects", i, "description"),
          true,
          2000,
        ),
        image: media(p.image, L("projects", i, "image"), true),
        domain: text(p.domain, L("projects", i, "domain"), true),
        url: link(p.url, L("projects", i, "url")),
        duration: text(p.duration, L("projects", i, "duration"), true),
        role: text(p.role, L("projects", i, "role"), true),
        year: text(p.year, L("projects", i, "year"), true, 8),
        stack: tagList(p.stack ?? [], L("projects", i, "stack")),
      }),
    ),
  };
}

async function load(c: Ctx) {
  ffmpegOk = undefined; // re-detect, in case it was installed since the last load
  let raw: Obj = {};
  try {
    raw = JSON.parse(await fs.readFile(c.jsonFile, "utf8")) as Obj;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT")
      fail(
        `src/data/work.json is not valid JSON: ${(e as Error).message}`,
        500,
      );
  }
  const arr = (k: string) => (Array.isArray(raw[k]) ? (raw[k] as Obj[]) : []);
  const data = {
    posters: arr("posters"),
    prints: arr("prints"),
    videos: arr("videos"),
    projects: arr("projects"),
  };
  const paths = new Set<string>();
  for (const items of Object.values(data))
    for (const it of items)
      for (const k of ["image", "thumbnail", "src"]) {
        const x = it[k];
        if (typeof x === "string" && x.startsWith("/work/")) paths.add(x);
      }
  const sizes: Record<string, number | null> = {};
  await Promise.all(
    [...paths].map(async (p) => {
      try {
        sizes[p] = (await fs.stat(filePath(c, p))).size;
      } catch {
        sizes[p] = null; // referenced but missing on disk
      }
    }),
  );
  return { data, sizes, ffmpeg: await hasFfmpeg() };
}

async function save(c: Ctx, body: unknown) {
  const data = normalize(body);
  await fs.mkdir(path.dirname(c.jsonFile), { recursive: true });
  let backup: string | null = null;
  if (await exists(c.jsonFile)) {
    await fs.mkdir(c.backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    backup = path.join(c.backupDir, `work-${stamp}.json`);
    await fs.copyFile(c.jsonFile, backup);
    const old = (await fs.readdir(c.backupDir))
      .filter((f) => /^work-.*\.json$/.test(f))
      .sort();
    for (const f of old.slice(0, Math.max(0, old.length - BACKUPS_KEPT)))
      await fs.rm(path.join(c.backupDir, f), { force: true });
  }
  await writeAtomic(c.jsonFile, JSON.stringify(data, null, 2) + "\n");
  return { ok: true, backup: backup ? path.basename(backup) : null };
}

/* ---------- plugin ---------- */

export function workAdmin(): Plugin {
  return {
    name: "work-admin",
    apply: "serve", // never runs in `vite build`
    configureServer(server) {
      const host = server.config.server.host;
      if (
        host &&
        host !== "localhost" &&
        host !== "127.0.0.1" &&
        host !== "::1"
      ) {
        server.config.logger.warn(
          "[work-admin] disabled: server.host must be localhost. Remove --host to use the admin.",
        );
        return;
      }
      const root = server.config.root;
      const c: Ctx = {
        workRoot: path.join(
          server.config.publicDir || path.join(root, "public"),
          "work",
        ),
        jsonFile: path.join(root, "src", "data", "work.json"),
        backupDir: path.join(root, ".work-backups"),
      };
      const parse = (b: Buffer) => {
        try {
          return JSON.parse(b.toString("utf8")) as unknown;
        } catch {
          return fail("Body is not valid JSON.", 400);
        }
      };
      server.middlewares.use(API, (req, res) => {
        (async () => {
          guard(req);
          const url = new URL(req.url ?? "/", "http://localhost");
          switch (`${req.method} ${url.pathname}`) {
            case "GET /data":
              return json(res, 200, await load(c));
            case "PUT /data":
              return json(
                res,
                200,
                await save(c, parse(await readBuffer(req, LIMIT.json))),
              );
            case "POST /upload":
              return json(res, 200, await upload(c, req, url.searchParams));
            case "POST /convert":
              return json(
                res,
                200,
                await convert(c, parse(await readBuffer(req, LIMIT.json))),
              );
            default:
              return fail("Unknown endpoint.", 404);
          }
        })().catch((err: unknown) => {
          const status = err instanceof HttpError ? err.status : 500;
          if (status === 500)
            server.config.logger.error(
              `[work-admin] ${(err as Error).stack ?? err}`,
            );
          json(res, status, {
            error: err instanceof Error ? err.message : "Unknown error",
          });
        });
      });
      server.httpServer?.once("listening", () =>
        server.config.logger.info("  Work admin: /admin/  (dev only)"),
      );
    },
  };
}
