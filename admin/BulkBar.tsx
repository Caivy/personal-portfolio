import { useId, useState } from "react";
import { FIELDS, type Field } from "./fields";
import { btn, btnPrimary, Control, inputCls } from "./ui";
import type { Cat } from "./types";

type Props = {
  cat: Cat;
  count: number;
  onApply: (f: Field, value: unknown, replaceTags: boolean) => void;
  onMoveTo: (to: Cat) => void;
  onDelete: () => void;
  onClear: () => void;
};

export function BulkBar({ cat, count, onApply, onMoveTo, onDelete, onClear }: Props) {
  const id = useId();
  const fields = FIELDS[cat].filter((f) => f.bulk);
  const [name, setName] = useState(fields[0]?.name ?? "");
  const f = fields.find((x) => x.name === name) ?? fields[0];
  const [val, setVal] = useState<unknown>("");
  const [replace, setReplace] = useState(false);
  const canMove = cat === "posts" || cat === "print";
  const other: Cat = cat === "posts" ? "print" : "posts";

  return (
    <section
      aria-label="Bulk edit"
      className="sticky top-0 z-10 mb-3 flex flex-wrap items-end gap-3 rounded-xl bg-navy p-3 text-white ring-2 ring-brand"
    >
      <p className="mr-1 self-center font-semibold" role="status">
        {count} selected
      </p>
      {f && (
        <>
          <div>
            <label htmlFor={`${id}-f`} className="mb-1 block text-xs font-semibold text-white/80">
              Set field
            </label>
            <select
              id={`${id}-f`}
              value={f.name}
              onChange={(e) => {
                setName(e.target.value);
                setVal(fields.find((x) => x.name === e.target.value)?.kind === "tags" ? [] : "");
              }}
              className={`${inputCls} w-40 !bg-white !text-navy`}
            >
              {fields.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-48 flex-1 text-navy">
            <label htmlFor={`${id}-v`} className="mb-1 block text-xs font-semibold text-white/80">
              To
            </label>
            <Control f={f} id={`${id}-v`} value={val} onChange={setVal} />
          </div>
          {f.kind === "tags" && (
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="size-4 accent-brand" />
              Replace existing tags
            </label>
          )}
          <button type="button" className={btnPrimary} onClick={() => onApply(f, val, replace)}>
            Apply to {count}
          </button>
        </>
      )}
      {canMove && (
        <div>
          <label htmlFor={`${id}-m`} className="mb-1 block text-xs font-semibold text-white/80">
            Category
          </label>
          <select id={`${id}-m`} value="" onChange={(e) => e.target.value && onMoveTo(other)} className={`${inputCls} w-44 !bg-white !text-navy`}>
            <option value="">Move to…</option>
            <option value={other}>{other === "print" ? "Print" : "Social posts"}</option>
          </select>
        </div>
      )}
      <button type="button" className={`${btn} !text-white !ring-white/40 hover:!bg-white/10`} onClick={onDelete}>
        Delete {count}
      </button>
      <button type="button" className={`${btn} !text-white !ring-white/40 hover:!bg-white/10`} onClick={onClear}>
        Clear selection
      </button>
    </section>
  );
}
