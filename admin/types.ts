export type Cat = "posts" | "print" | "videos" | "projects";
export type Ratio = "portrait" | "landscape" | "square";
export type Mode = "crop" | "fit" | "keep";
export const MODE_LABEL: Record<Mode, string> = {
  fit: "Fit the whole image (blurred backdrop)",
  crop: "Crop to fill the frame",
  keep: "Keep the original shape",
};
export type Item = Record<string, unknown>;
export type Report = { before?: number; after?: number; notes: string[] };
export type Row = { key: string; v: Item; report?: Report };
export type Rows = Record<Cat, Row[]>;
export type WorkJson = {
  posters: Item[];
  prints: Item[];
  videos: Item[];
  projects: Item[];
};

export const CATS = [
  {
    id: "posts",
    label: "Social posts",
    json: "posters",
    imageKey: "image",
    target: "4:5, 1080×1350",
  },
  {
    id: "print",
    label: "Print",
    json: "prints",
    imageKey: "image",
    target: "set by ratio",
  },
  {
    id: "videos",
    label: "Video",
    json: "videos",
    imageKey: "thumbnail",
    target: "16:9, 1280×720",
  },
  {
    id: "projects",
    label: "IT projects",
    json: "projects",
    imageKey: "image",
    target: "16:10, 1600×1000",
  },
] as const;

export const str = (v: Item, k: string) =>
  typeof v[k] === "string" ? (v[k] as string) : "";
export const tagsOf = (v: Item): string[] =>
  Array.isArray(v.stack)
    ? v.stack.filter((s): s is string => typeof s === "string")
    : [];
export const uid = () => crypto.randomUUID();
export const kb = (n: number) =>
  n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;

export const detectRatio = (w: number, h: number): Ratio =>
  w / h > 1.15 ? "landscape" : w / h < 0.87 ? "portrait" : "square";
export const RATIO_VALUE: Record<Ratio, number> = {
  portrait: 210 / 297,
  landscape: 297 / 210,
  square: 1,
};

const clean = (v: Item): Item =>
  Object.fromEntries(
    Object.entries(v)
      .filter(
        ([k, x]) =>
          k === "stack" ||
          (typeof x === "string" ? x.trim() !== "" : x !== undefined),
      )
      .map(([k, x]) => [k, typeof x === "string" ? x.trim() : x]),
  );

export const toRows = (d: WorkJson): Rows =>
  Object.fromEntries(
    CATS.map((c) => [c.id, (d[c.json] ?? []).map((v) => ({ key: uid(), v }))]),
  ) as Rows;

export const fromRows = (r: Rows): WorkJson =>
  Object.fromEntries(
    CATS.map((c) => [c.json, r[c.id].map((x) => clean(x.v))]),
  ) as WorkJson;
