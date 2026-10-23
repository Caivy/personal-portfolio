import { CATS, RATIO_VALUE, kb, str, tagsOf, type Cat, type Item, type Ratio } from "./types";

export type Issue = { level: "error" | "warn"; msg: string };
export type Ctx = {
  dims?: { w: number; h: number };
  sizes: Record<string, number | null | undefined>; // null = missing on disk
  dupes: Set<string>;
};

const MAX_IMG: Record<Cat, number> = { posts: 450 * 1024, print: 900 * 1024, videos: 200 * 1024, projects: 500 * 1024 };
const MAX_VIDEO = 50 * 1048576;
const isUrl = (s: string) => /^https?:\/\//i.test(s);

export function targetRatio(cat: Cat, v: Item): { value: number; label: string } {
  if (cat === "posts") return { value: 4 / 5, label: "4:5" };
  if (cat === "videos") return { value: 16 / 9, label: "16:9" };
  if (cat === "projects") return { value: 16 / 10, label: "16:10" };
  const r = (str(v, "ratio") || "portrait") as Ratio;
  return { value: RATIO_VALUE[r] ?? RATIO_VALUE.portrait, label: r };
}

export function validate(cat: Cat, v: Item, ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  const err = (msg: string) => out.push({ level: "error", msg });
  const warn = (msg: string) => out.push({ level: "warn", msg });

  const title = str(v, "title").trim();
  if (!title) err("Title is missing.");
  else if (ctx.dupes.has(title.toLowerCase())) warn("Another item has the same title. The site uses titles as list keys.");

  const imageKey = CATS.find((c) => c.id === cat)!.imageKey;
  const img = str(v, imageKey);
  if (!img) {
    if (cat === "posts") warn("No image. The site shows a placeholder.");
    else err(cat === "videos" ? "Thumbnail is missing. Use Thumbnail to upload one." : "Image is missing.");
  } else {
    const size = ctx.sizes[img];
    if (size === null) err("Image file was not found in public/work.");
    else if (size && size > MAX_IMG[cat]) warn(`Image is ${kb(size)}. Aim for under ${kb(MAX_IMG[cat])}.`);
    if (ctx.dims) {
      const t = targetRatio(cat, v);
      if (Math.abs(ctx.dims.w / ctx.dims.h / t.value - 1) > 0.02)
        warn(`Image is ${ctx.dims.w}×${ctx.dims.h}, but the site shows ${t.label}. It will be cropped.`);
    }
  }

  if (cat === "print" && !str(v, "type").trim()) err("Type is missing (for example Flyer).");

  if (cat === "videos") {
    const src = str(v, "src").trim();
    const href = str(v, "href").trim();
    if (!src && !href) err("Add a video file or an external link.");
    if (src && href) warn("Both a file and a link are set. The site plays the file.");
    if (href && !isUrl(href)) err("Link must start with http:// or https://.");
    if (src) {
      const size = ctx.sizes[src];
      if (size === null) err("Video file was not found in public/work.");
      else if (size && size > MAX_VIDEO) warn(`Video is ${kb(size)} and ships with the site. Consider compressing it.`);
    }
    const d = str(v, "duration").trim();
    if (d && !/^\d+:[0-5]\d(:[0-5]\d)?$/.test(d)) warn("Duration looks off. Use m:ss, for example 0:45.");
  }

  if (cat === "projects") {
    if (!str(v, "description").trim()) err("Description is missing.");
    if (!str(v, "domain").trim()) err("Domain is missing.");
    const url = str(v, "url").trim();
    if (url && !isUrl(url)) err("Site URL must start with http:// or https://.");
    for (const k of ["duration", "role"]) if (!str(v, k).trim()) warn(`${k === "duration" ? "Time to build" : "Role"} is empty.`);
    if (!/^\d{4}$/.test(str(v, "year").trim())) warn("Year should be four digits.");
    if (!tagsOf(v).length) warn("No stack tags.");
  }
  return out;
}
