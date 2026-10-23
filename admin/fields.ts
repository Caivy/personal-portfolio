import type { Cat } from "./types";

export type Field = {
  name: string;
  label: string;
  kind: "text" | "area" | "select" | "tags";
  options?: string[]; // select
  list?: string[]; // suggestions for text
  bulk?: boolean; // offered in bulk edit
};

export const FIELDS: Record<Cat, Field[]> = {
  posts: [
    { name: "title", label: "Title", kind: "text" },
    { name: "client", label: "Client", kind: "text", bulk: true },
  ],
  print: [
    { name: "title", label: "Title", kind: "text" },
    { name: "type", label: "Type", kind: "text", bulk: true, list: ["Flyer", "Brochure", "Banner", "Name card", "Poster", "Sticker", "Catalog"] },
    { name: "size", label: "Size", kind: "text", bulk: true, list: ["A5", "A4", "A3", "90×55 mm", "85×55 mm", "2×1 m"] },
    { name: "ratio", label: "Ratio", kind: "select", bulk: true, options: ["", "portrait", "landscape", "square"] },
  ],
  videos: [
    { name: "title", label: "Title", kind: "text" },
    { name: "meta", label: "Label (for example Reel, Facebook)", kind: "text", bulk: true },
    { name: "duration", label: "Duration (m:ss)", kind: "text" },
    { name: "src", label: "Video file (.mp4 in /work/videos)", kind: "text" },
    { name: "href", label: "External link", kind: "text" },
  ],
  projects: [
    { name: "title", label: "Title", kind: "text" },
    { name: "description", label: "Description", kind: "area" },
    { name: "domain", label: "Domain (address bar)", kind: "text" },
    { name: "url", label: "Site URL", kind: "text" },
    { name: "duration", label: "Time to build", kind: "text", bulk: true },
    { name: "role", label: "Role", kind: "text", bulk: true },
    { name: "year", label: "Year", kind: "text", bulk: true },
    { name: "stack", label: "Stack", kind: "tags", bulk: true },
  ],
};
