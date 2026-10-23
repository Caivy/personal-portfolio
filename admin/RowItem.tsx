import { useRef, useState } from "react";
import { FIELDS } from "./fields";
import { Preview } from "./Preview";
import { btn, FieldRow, iconBtn, inputCls } from "./ui";
import { kb, str, type Cat, type Item, type Row } from "./types";
import type { Issue } from "./validate";

type Props = {
  cat: Cat;
  row: Row;
  index: number;
  count: number;
  selected: boolean;
  open: boolean;
  issues: Issue[];
  bytes?: number | null;
  dropTarget: boolean;
  onSelect: (on: boolean) => void;
  onToggle: () => void;
  onPatch: (p: Item) => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
  onReplace: (f: File) => void;
  onDims: (src: string, w: number, h: number) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

export function RowItem(p: Props) {
  const { cat, row, issues } = p;
  const v = row.v;
  const img = str(v, cat === "videos" ? "thumbnail" : "image");
  const title = str(v, "title");
  const [armed, setArmed] = useState(false); // draggable only while the handle is pressed, so inputs stay selectable
  const file = useRef<HTMLInputElement>(null);

  const summary =
    cat === "posts"
      ? str(v, "client")
      : cat === "print"
        ? [str(v, "type"), str(v, "size")].filter(Boolean).join(", ")
        : cat === "videos"
          ? [str(v, "meta"), str(v, "duration")].filter(Boolean).join(", ")
          : str(v, "domain");

  const move = (d: -1 | 1) => {
    const el = document.activeElement as HTMLElement | null;
    p.onMove(d);
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <li
      draggable={armed}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", row.key);
        e.dataTransfer.effectAllowed = "move";
        p.onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        p.onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        p.onDrop();
      }}
      onDragEnd={() => {
        setArmed(false);
        p.onDragEnd();
      }}
      className={`rounded-xl bg-panel ring-1 ${p.selected ? "ring-2 ring-brand" : "ring-line"} ${p.dropTarget ? "shadow-[0_-4px_0_0_var(--color-brand)]" : ""}`}
    >
      <div className="flex items-start gap-2.5 p-2.5">
        <input
          type="checkbox"
          checked={p.selected}
          onChange={(e) => p.onSelect(e.target.checked)}
          aria-label={`Select ${title || "untitled item"}`}
          className="mt-3 size-4 shrink-0 accent-brand"
        />
        <button
          type="button"
          aria-label={`Reorder ${title || "item"}. Drag it, or hold Alt and press the up or down arrow.`}
          onPointerDown={() => setArmed(true)}
          onPointerUp={() => setArmed(false)}
          onKeyDown={(e) => {
            if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
              e.preventDefault();
              move(e.key === "ArrowUp" ? -1 : 1);
            }
          }}
          className="mt-2 grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded text-lg leading-none text-muted hover:text-ink active:cursor-grabbing"
        >
          ⠿
        </button>

        {img ? (
          <img
            src={img}
            alt=""
            loading="lazy"
            onLoad={(e) => p.onDims(img, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
            className={`size-14 shrink-0 rounded-md bg-sky object-cover ring-1 ring-line ${cat === "projects" ? "object-top" : ""}`}
          />
        ) : (
          <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-md bg-sky text-center text-[11px] font-semibold leading-tight text-navy">
            No image
          </span>
        )}

        <div className="min-w-0 flex-1">
          <input
            aria-label="Title"
            value={title}
            aria-invalid={!title.trim()}
            onChange={(e) => p.onPatch({ title: e.target.value })}
            className={`${inputCls} font-semibold`}
          />
          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
            {summary && <span>{summary}</span>}
            {row.report?.before !== undefined && row.report.after !== undefined ? (
              <span>
                {kb(row.report.before)} to {kb(row.report.after)}
              </span>
            ) : (
              p.bytes && <span>{kb(p.bytes)}</span>
            )}
          </div>
          {(issues.length > 0 || (row.report?.notes.length ?? 0) > 0) && (
            <ul className="mt-1 space-y-0.5 text-xs">
              {issues.map((i) => (
                <li key={i.msg} className={i.level === "error" ? "font-semibold text-red-700 dark:text-red-400" : "text-amber-800 dark:text-brand"}>
                  {i.level === "error" ? "Error: " : "Warning: "}
                  {i.msg}
                </li>
              ))}
              {row.report?.notes.map((n) => (
                <li key={n} className="text-muted">
                  Note: {n}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <button type="button" className={btn} aria-expanded={p.open} onClick={p.onToggle}>
            {p.open ? "Done" : "Edit"}
          </button>
          <button type="button" className={btn} onClick={() => file.current?.click()}>
            {cat === "videos" ? "Thumbnail" : "Replace image"}
          </button>
          <button type="button" className={iconBtn} aria-label={`Move ${title || "item"} up`} disabled={p.index === 0} onClick={() => move(-1)}>
            ↑
          </button>
          <button type="button" className={iconBtn} aria-label={`Move ${title || "item"} down`} disabled={p.index === p.count - 1} onClick={() => move(1)}>
            ↓
          </button>
          <button
            type="button"
            className={`${iconBtn} text-red-700 dark:text-red-400`}
            aria-label={`Delete ${title || "item"}`}
            onClick={p.onDelete}
          >
            ✕
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) p.onReplace(f);
          }}
        />
      </div>

      {p.open && (
        <div className="grid gap-5 border-t border-line p-4 lg:grid-cols-[1fr_auto]">
          <div className="grid content-start gap-3 sm:grid-cols-2">
            {FIELDS[cat]
              .filter((f) => f.name !== "title")
              .map((f) => (
                <FieldRow key={f.name} f={f} v={v} onChange={(val) => p.onPatch({ [f.name]: val })} />
              ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Preview on the site</p>
            <Preview cat={cat} v={v} />
          </div>
        </div>
      )}
    </li>
  );
}
