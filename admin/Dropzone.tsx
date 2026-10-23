import { useEffect, useId, useRef, useState } from "react";
import { api } from "./api";
import { FIELDS } from "./fields";
import { targetRatio } from "./validate";
import { btn, btnPrimary, Control, inputCls, iconBtn } from "./ui";
import {
  detectRatio,
  kb,
  MODE_LABEL,
  uid,
  type Cat,
  type Item,
  type Mode,
  type Ratio,
  type Row,
} from "./types";

type Staged = {
  id: string;
  file: File;
  title: string;
  preview?: string;
  w?: number;
  h?: number;
  ratio?: Ratio;
  status: "ready" | "working" | "error";
  msg?: string;
};

const IMG = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;
const LIMITS = { image: 25 * 1048576, video: 300 * 1048576 };
const titleFrom = (name: string) => {
  const t = name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

type Props = {
  cat: Cat;
  ffmpeg: boolean;
  mode: Mode;
  onMode: (m: Mode) => void;
  onAdd: (row: Row) => void;
  onSize: (path: string, bytes: number) => void;
};

export function Dropzone({ cat, ffmpeg, mode, onMode, onAdd, onSize }: Props) {
  const isVideo = cat === "videos";
  const [staged, setStaged] = useState<Staged[]>([]);
  const [defaults, setDefaults] = useState<Item>(
    cat === "projects" ? { year: String(new Date().getFullYear()) } : {},
  );
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const uid0 = useId();
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

  const accepted = (f: File) =>
    isVideo ? /\.mp4$/i.test(f.name) : IMG.test(f.name);
  const bulkFields = FIELDS[cat].filter((f) => f.bulk);

  async function addFiles(list: FileList | File[]) {
    const files = [...list];
    const ok = files.filter(accepted);
    const skipped = files.length - ok.length;
    setNote(
      skipped
        ? `${skipped} file${skipped > 1 ? "s" : ""} skipped. ${isVideo ? "This tab takes .mp4 files." : "This tab takes JPG, PNG, WebP, AVIF, GIF or TIFF."}`
        : "",
    );
    const next = await Promise.all(
      ok.map(async (file) => {
        const s: Staged = {
          id: uid(),
          file,
          title: titleFrom(file.name),
          status: "ready",
        };
        if (!isVideo) {
          s.preview = URL.createObjectURL(file);
          urls.current.push(s.preview);
          try {
            const b = await createImageBitmap(file);
            s.w = b.width;
            s.h = b.height;
            b.close();
          } catch {
            /* the browser can't decode it (for example TIFF); the server still can */
          }
        }
        return s;
      }),
    );
    setStaged((p) => [...p, ...next]);
  }

  const ratioOf = (s: Staged): Ratio =>
    s.ratio ?? (s.w && s.h ? detectRatio(s.w, s.h) : "portrait");
  const limit = isVideo ? LIMITS.video : LIMITS.image;

  function problems(s: Staged): { error?: string; warn?: string } {
    if (s.file.size > limit)
      return { error: `${kb(s.file.size)} is over the ${kb(limit)} limit.` };
    const out: { warn?: string } = {};
    if (!isVideo && s.file.size > 10 * 1048576)
      out.warn = `Large source (${kb(s.file.size)}). It will be compressed.`;
    if (isVideo && s.file.size > 50 * 1048576)
      out.warn = `Large video (${kb(s.file.size)}). It ships with the site as is.`;
    if (!isVideo && s.w && s.h) {
      const t = targetRatio(cat, { ratio: ratioOf(s) });
      if (Math.abs(s.w / s.h / t.value - 1) > 0.02) {
        if (mode === "crop")
          out.warn = `${s.w}×${s.h} will be cropped to ${t.label}.`;
        if (mode === "fit")
          out.warn = `${s.w}×${s.h} will be fitted into ${t.label} with a blurred backdrop.`;
      }
    }
    return out;
  }

  async function run() {
    setBusy(true);
    for (const s of staged) {
      if (problems(s).error) continue;
      setStaged((p) =>
        p.map((x) =>
          x.id === s.id ? { ...x, status: "working", msg: undefined } : x,
        ),
      );
      try {
        const ratio = cat === "print" ? ratioOf(s) : undefined;
        const r = await api.upload(s.file, {
          category: cat,
          kind: isVideo ? "video" : "image",
          ratio,
          mode: isVideo ? undefined : mode,
        });
        const d: Item = Object.fromEntries(
          Object.entries(defaults).filter(([, x]) =>
            Array.isArray(x) ? x.length : x !== "" && x != null,
          ),
        );
        let v: Item;
        if (cat === "posts") v = { title: s.title.trim(), image: r.path, ...d };
        else if (cat === "print")
          v = {
            title: s.title.trim(),
            image: r.path,
            type: "",
            ...(ratio && ratio !== "portrait" ? { ratio } : {}),
            ...d,
          };
        else if (cat === "videos")
          v = {
            title: s.title.trim(),
            thumbnail: r.thumbnail ?? "",
            duration: r.duration ?? "",
            src: r.src,
            ...d,
          };
        else
          v = {
            title: s.title.trim(),
            description: "",
            image: r.path,
            domain: "",
            url: "",
            duration: "",
            role: "",
            year: "",
            stack: [],
            ...d,
          };
        if (r.path) onSize(r.path, r.bytesAfter);
        if (r.src) onSize(r.src, r.bytesAfter);
        if (r.thumbnail && r.thumbBytes) onSize(r.thumbnail, r.thumbBytes);
        onAdd({
          key: uid(),
          v,
          report: {
            before: r.bytesBefore,
            after: r.bytesAfter,
            notes: r.warnings,
          },
        });
        setStaged((p) => p.filter((x) => x.id !== s.id));
      } catch (e) {
        setStaged((p) =>
          p.map((x) =>
            x.id === s.id
              ? { ...x, status: "error", msg: (e as Error).message }
              : x,
          ),
        );
      }
    }
    setBusy(false);
  }

  const pending = staged.filter((s) => !problems(s).error).length;

  return (
    <section aria-label="Upload" className="mb-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-5 ${over ? "border-brand bg-brand/10" : "border-line bg-panel"}`}
      >
        <div>
          <p className="font-semibold text-ink">
            {isVideo ? "Drop .mp4 files here" : "Drop images here"}
          </p>
          <p className="text-sm text-muted">
            {isVideo
              ? ffmpeg
                ? "ffmpeg found. Thumbnails and durations are made automatically."
                : "ffmpeg not found. Add each thumbnail and duration by hand."
              : "Converted to WebP and resized."}
          </p>
        </div>
        {!isVideo && (
          <div>
            <label
              htmlFor={`${uid0}-mode`}
              className="mb-1 block text-xs font-semibold text-muted"
            >
              Image fitting
            </label>
            <select
              id={`${uid0}-mode`}
              value={mode}
              onChange={(e) => onMode(e.target.value as Mode)}
              className={`${inputCls} w-72`}
            >
              {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          className={btn}
          onClick={() => input.current?.click()}
        >
          Choose files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={isVideo ? "video/mp4,.mp4" : "image/*"}
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {note && (
        <p
          role="status"
          className="mt-2 text-sm text-amber-800 dark:text-brand"
        >
          {note}
        </p>
      )}

      {staged.length > 0 && (
        <div className="mt-3 rounded-xl bg-panel p-3 ring-1 ring-line">
          {bulkFields.length > 0 && (
            <fieldset className="mb-3 grid gap-3 border-b border-line pb-3 sm:grid-cols-2 lg:grid-cols-4">
              <legend className="mb-2 text-xs font-semibold text-muted">
                Defaults for every new item in this batch
              </legend>
              {bulkFields.map((f) => (
                <div
                  key={f.name}
                  className={f.kind === "tags" ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={`${uid0}-${f.name}`}
                    className="mb-1 block text-xs font-semibold text-muted"
                  >
                    {f.label}
                  </label>
                  <Control
                    f={f}
                    id={`${uid0}-${f.name}`}
                    value={defaults[f.name]}
                    onChange={(val) =>
                      setDefaults((d) => ({ ...d, [f.name]: val }))
                    }
                  />
                </div>
              ))}
            </fieldset>
          )}
          <ul className="space-y-2">
            {staged.map((s) => {
              const pr = problems(s);
              return (
                <li key={s.id} className="flex items-center gap-3">
                  {s.preview ? (
                    <img
                      src={s.preview}
                      alt=""
                      className="size-12 shrink-0 rounded-md bg-sky object-cover ring-1 ring-line"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-md bg-navy text-xs font-semibold text-white"
                    >
                      MP4
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <input
                      aria-label={`Title for ${s.file.name}`}
                      value={s.title}
                      onChange={(e) =>
                        setStaged((p) =>
                          p.map((x) =>
                            x.id === s.id ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                      className={inputCls}
                    />
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {s.file.name}, {kb(s.file.size)}
                      {s.w && s.h ? `, ${s.w}×${s.h}` : ""}
                    </p>
                    {pr.error && (
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                        Error: {pr.error} It will be skipped.
                      </p>
                    )}
                    {!pr.error && pr.warn && (
                      <p className="text-xs text-amber-800 dark:text-brand">
                        Warning: {pr.warn}
                      </p>
                    )}
                    {s.status === "error" && (
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                        Error: {s.msg}
                      </p>
                    )}
                    {s.status === "working" && (
                      <p className="text-xs text-muted">Processing…</p>
                    )}
                  </div>
                  {cat === "print" && (
                    <select
                      aria-label={`Ratio for ${s.file.name}`}
                      value={ratioOf(s)}
                      onChange={(e) =>
                        setStaged((p) =>
                          p.map((x) =>
                            x.id === s.id
                              ? { ...x, ratio: e.target.value as Ratio }
                              : x,
                          ),
                        )
                      }
                      className={`${inputCls} w-32`}
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                      <option value="square">Square</option>
                    </select>
                  )}
                  <button
                    type="button"
                    className={iconBtn}
                    aria-label={`Remove ${s.file.name} from the batch`}
                    disabled={s.status === "working"}
                    onClick={() =>
                      setStaged((p) => p.filter((x) => x.id !== s.id))
                    }
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={busy || pending === 0}
              onClick={() => void run()}
            >
              {busy
                ? "Processing…"
                : `Process and add ${pending} file${pending === 1 ? "" : "s"}`}
            </button>
            <button
              type="button"
              className={btn}
              disabled={busy}
              onClick={() => setStaged([])}
            >
              Clear batch
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
