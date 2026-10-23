import { useId, useState, type KeyboardEvent } from "react";
import type { Field } from "./fields";
import { str, tagsOf, type Item } from "./types";

export const inputCls = "h-9 w-full rounded-md bg-surface px-2.5 text-sm text-ink ring-1 ring-line placeholder:text-muted";
export const btn =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md px-3 text-sm font-semibold text-ink ring-1 ring-line hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40";
export const btnPrimary =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-navy hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
export const iconBtn =
  "grid size-9 shrink-0 place-items-center rounded-md text-ink ring-1 ring-line hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30";

export function TagInput({ id, value, onChange }: { id?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const next = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (next.length) onChange([...new Set([...value, ...next])]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
  };
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md bg-surface p-1 ring-1 ring-line">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-panel py-0.5 pl-2.5 pr-1 text-xs font-semibold text-ink">
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => onChange(value.filter((x) => x !== t))}
            className="grid size-5 place-items-center rounded-full hover:bg-line"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : "Type a tag, press Enter"}
        className="h-7 min-w-28 flex-1 bg-transparent px-1.5 text-sm placeholder:text-muted"
      />
    </div>
  );
}

/** One input for a field definition. `value` is a string, or string[] for tags. */
export function Control({ f, id, value, onChange }: { f: Field; id: string; value: unknown; onChange: (v: unknown) => void }) {
  if (f.kind === "tags") return <TagInput id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  const s = typeof value === "string" ? value : "";
  if (f.kind === "area")
    return <textarea id={id} rows={3} value={s} onChange={(e) => onChange(e.target.value)} className={`${inputCls} h-auto py-2`} />;
  if (f.kind === "select")
    return (
      <select id={id} value={s} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {f.options?.map((o) => (
          <option key={o} value={o}>
            {o || "Default (portrait)"}
          </option>
        ))}
      </select>
    );
  const listId = f.list ? `${id}-list` : undefined;
  return (
    <>
      <input id={id} list={listId} value={s} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      {f.list && (
        <datalist id={listId}>
          {f.list.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </>
  );
}

export function FieldRow({ f, v, onChange }: { f: Field; v: Item; onChange: (v: unknown) => void }) {
  const id = useId();
  return (
    <div className={f.kind === "area" || f.kind === "tags" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-muted">
        {f.label}
      </label>
      <Control f={f} id={id} value={f.kind === "tags" ? tagsOf(v) : str(v, f.name)} onChange={onChange} />
    </div>
  );
}
