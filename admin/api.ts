import type { Cat, Mode, Ratio, WorkJson } from "./types";

const H = { "x-work-admin": "1" };
async function j<T>(r: Response): Promise<T> {
  const b = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(b.error ?? r.statusText);
  return b as T;
}

export type LoadResp = {
  data: WorkJson;
  sizes: Record<string, number | null>;
  ffmpeg: boolean;
};
export type UploadResp = {
  path?: string; // images
  src?: string; // videos
  thumbnail?: string;
  duration?: string;
  ffmpeg?: boolean;
  ratio?: Ratio;
  bytesBefore: number;
  bytesAfter: number;
  thumbBytes?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  warnings: string[];
};

export const api = {
  load: () => fetch("/__work/data", { headers: H }).then(j<LoadResp>),
  save: (data: WorkJson) =>
    fetch("/__work/data", {
      method: "PUT",
      headers: { ...H, "content-type": "application/json" },
      body: JSON.stringify(data),
    }).then(j<{ ok: true; backup: string | null }>),
  upload: (
    file: File,
    q: { category: Cat; kind: "image" | "video"; ratio?: string; mode?: Mode },
  ) => {
    const p = new URLSearchParams({
      category: q.category,
      kind: q.kind,
      name: file.name,
    });
    if (q.ratio) p.set("ratio", q.ratio);
    if (q.mode) p.set("mode", q.mode);
    return fetch(`/__work/upload?${p}`, {
      method: "POST",
      headers: { ...H, "content-type": "application/octet-stream" },
      body: file,
    }).then(j<UploadResp>);
  },
  convert: (b: { src: string; category: Cat; ratio?: string; mode?: Mode }) =>
    fetch("/__work/convert", {
      method: "POST",
      headers: { ...H, "content-type": "application/json" },
      body: JSON.stringify(b),
    }).then(j<UploadResp>),
};
