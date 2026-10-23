import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { api } from "./api";
import { BulkBar } from "./BulkBar";
import { Dropzone } from "./Dropzone";
import type { Field } from "./fields";
import { RowItem } from "./RowItem";
import { btn, btnPrimary } from "./ui";
import {
  CATS,
  fromRows,
  str,
  tagsOf,
  toRows,
  uid,
  type Cat,
  type Item,
  type Mode,
  type Report,
  type Row,
  type Rows,
} from "./types";
import { validate, type Issue } from "./validate";

const EMPTY: Rows = { posts: [], print: [], videos: [], projects: [] };
type Toast = { msg: string; undo?: () => void } | null;

export function App() {
  const [rows, setRows] = useState<Rows>(EMPTY);
  const [sizes, setSizes] = useState<Record<string, number | null>>({});
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>(
    {},
  );
  const [ffmpeg, setFfmpeg] = useState(false);
  const [saved, setSaved] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Cat>("posts");
  const [modes, setModes] = useState<Record<Cat, Mode>>({
    posts: "fit",
    print: "fit",
    videos: "crop",
    projects: "crop",
  });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<Toast>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const drag = useRef<string | null>(null);
  const timer = useRef<number>(0);

  const say = useCallback((msg: string, undo?: () => void) => {
    window.clearTimeout(timer.current);
    setToast({ msg, undo });
    timer.current = window.setTimeout(() => setToast(null), undo ? 9000 : 5000);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.load();
      const r = toRows(res.data);
      setRows(r);
      setSizes(res.sizes);
      setFfmpeg(res.ffmpeg);
      setSaved(JSON.stringify(fromRows(r)));
      setSel(new Set());
      setLoadErr("");
      setReady(true);
    } catch (e) {
      setLoadErr((e as Error).message);
    }
  }, []);
  useEffect(() => void load(), [load]);

  const dirty = ready && JSON.stringify(fromRows(rows)) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  /* ---------- validation ---------- */
  const issues = useMemo(() => {
    const out: Record<string, Issue[]> = {};
    for (const c of CATS) {
      const seen = new Map<string, number>();
      for (const r of rows[c.id]) {
        const t = str(r.v, "title").trim().toLowerCase();
        if (t) seen.set(t, (seen.get(t) ?? 0) + 1);
      }
      const dupes = new Set([...seen].filter(([, n]) => n > 1).map(([t]) => t));
      for (const r of rows[c.id])
        out[r.key] = validate(c.id, r.v, {
          dims: dims[str(r.v, c.imageKey)],
          sizes,
          dupes,
        });
    }
    return out;
  }, [rows, sizes, dims]);
  const errorCount = (cat: Cat) =>
    rows[cat].reduce(
      (n, r) => n + issues[r.key].filter((i) => i.level === "error").length,
      0,
    );
  const totalErrors = CATS.reduce((n, c) => n + errorCount(c.id), 0);

  /* ---------- edits ---------- */
  const patch = (cat: Cat, key: string, p: Item, report?: Report) =>
    setRows((r) => ({
      ...r,
      [cat]: r[cat].map((x) =>
        x.key === key
          ? { ...x, v: { ...x.v, ...p }, ...(report ? { report } : {}) }
          : x,
      ),
    }));
  const add = (cat: Cat, row: Row) =>
    setRows((r) => ({ ...r, [cat]: [...r[cat], row] }));
  const reorder = (cat: Cat, from: number, to: number) =>
    setRows((r) => {
      const a = [...r[cat]];
      const [m] = a.splice(from, 1);
      a.splice(to, 0, m);
      return { ...r, [cat]: a };
    });
  const setSize = (path: string, bytes: number) =>
    setSizes((s) => ({ ...s, [path]: bytes }));

  function remove(cat: Cat, keys: Set<string>) {
    const removed = rows[cat]
      .map((row, index) => ({ row, index }))
      .filter((x) => keys.has(x.row.key));
    if (!removed.length) return;
    setRows((r) => ({ ...r, [cat]: r[cat].filter((x) => !keys.has(x.key)) }));
    setSel(new Set());
    say(
      `Deleted ${removed.length} item${removed.length > 1 ? "s" : ""}. Image files stay on disk.`,
      () =>
        setRows((r) => {
          const a = [...r[cat]];
          removed.forEach(({ row, index }) =>
            a.splice(Math.min(index, a.length), 0, row),
          );
          return { ...r, [cat]: a };
        }),
    );
  }

  async function replace(cat: Cat, row: Row, file: File) {
    try {
      const r = await api.upload(file, {
        category: cat,
        kind: "image",
        ratio: cat === "print" ? str(row.v, "ratio") || "portrait" : undefined,
        mode: modes[cat],
      });
      setSize(r.path!, r.bytesAfter);
      patch(
        cat,
        row.key,
        { [cat === "videos" ? "thumbnail" : "image"]: r.path },
        { before: r.bytesBefore, after: r.bytesAfter, notes: r.warnings },
      );
      say(`Replaced the image for ${str(row.v, "title") || "item"}.`);
    } catch (e) {
      say(`Upload failed: ${(e as Error).message}`);
    }
  }

  function bulkApply(f: Field, value: unknown, replaceTags: boolean) {
    setRows((r) => ({
      ...r,
      [tab]: r[tab].map((x) => {
        if (!sel.has(x.key)) return x;
        const next =
          f.kind === "tags"
            ? replaceTags
              ? (value as string[])
              : [...new Set([...tagsOf(x.v), ...(value as string[])])]
            : value;
        return { ...x, v: { ...x.v, [f.name]: next } };
      }),
    }));
    say(
      `Set ${f.label.toLowerCase()} on ${sel.size} item${sel.size > 1 ? "s" : ""}.`,
    );
  }

  async function moveTo(from: Cat, to: Cat) {
    const picked = rows[from].filter((r) => sel.has(r.key));
    const done = new Set<string>();
    const added: Row[] = [];
    for (const r of picked) {
      try {
        const res = await api.convert({
          src: str(r.v, "image"),
          category: to,
          ratio: to === "print" ? str(r.v, "ratio") || undefined : undefined,
          mode: modes[to],
        });
        setSize(res.path!, res.bytesAfter);
        const title = str(r.v, "title");
        const v: Item =
          to === "print"
            ? {
                title,
                image: res.path,
                type: "",
                ...(res.ratio && res.ratio !== "portrait"
                  ? { ratio: res.ratio }
                  : {}),
              }
            : { title, image: res.path };
        added.push({
          key: uid(),
          v,
          report: {
            before: res.bytesBefore,
            after: res.bytesAfter,
            notes: ["Re-cropped from the stored image.", ...res.warnings],
          },
        });
        done.add(r.key);
      } catch (e) {
        say(
          `Could not move ${str(r.v, "title") || "an item"}: ${(e as Error).message}`,
        );
      }
    }
    setRows((r) => ({
      ...r,
      [from]: r[from].filter((x) => !done.has(x.key)),
      [to]: [...r[to], ...added],
    }));
    setSel(new Set());
    if (done.size)
      say(
        `Moved ${done.size} item${done.size > 1 ? "s" : ""} to ${to === "print" ? "Print" : "Social posts"}. Check type and ratio.`,
      );
  }

  async function save() {
    if (totalErrors)
      return say(
        `Fix ${totalErrors} error${totalErrors > 1 ? "s" : ""} before saving.`,
      );
    setSaving(true);
    try {
      const data = fromRows(rows);
      const r = await api.save(data);
      setSaved(JSON.stringify(data));
      say(
        r.backup
          ? `Saved to src/data/work.json. Previous version: .work-backups/${r.backup}`
          : "Saved to src/data/work.json.",
      );
    } catch (e) {
      say(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ---------- render ---------- */
  const list = rows[tab];
  const onTabKey = (e: KeyboardEvent) => {
    const i = CATS.findIndex((c) => c.id === tab);
    const n =
      e.key === "ArrowRight"
        ? (i + 1) % CATS.length
        : e.key === "ArrowLeft"
          ? (i - 1 + CATS.length) % CATS.length
          : -1;
    if (n < 0) return;
    e.preventDefault();
    switchTab(CATS[n].id);
    document.getElementById(`admin-tab-${CATS[n].id}`)?.focus();
  };
  const switchTab = (c: Cat) => {
    setTab(c);
    setSel(new Set());
  };
  const meta = CATS.find((c) => c.id === tab)!;

  if (loadErr)
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-extrabold">
          Could not load the work data
        </h1>
        <p className="mt-2 text-muted">{loadErr}</p>
        <p className="mt-2 text-muted">
          Open this page from the dev server (npm run dev) on localhost. The
          admin does not exist in a production build.
        </p>
        <button className={`${btnPrimary} mt-4`} onClick={() => void load()}>
          Try again
        </button>
      </main>
    );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="mr-auto">
            <h1 className="text-xl font-extrabold leading-tight">Work admin</h1>
            <p className="text-xs text-white/70">
              Dev only. Writes src/data/work.json and public/work/.
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4"
          >
            View site<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p role="status" className="text-sm font-semibold">
            {!ready
              ? "Loading…"
              : totalErrors
                ? `${totalErrors} error${totalErrors > 1 ? "s" : ""} to fix`
                : dirty
                  ? "Unsaved changes"
                  : "All changes saved"}
          </p>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => void load()}
            className={`${btn} !text-white !ring-white/40 hover:!bg-white/10`}
          >
            Discard changes
          </button>
          <button
            type="button"
            disabled={!dirty || saving || totalErrors > 0}
            onClick={() => void save()}
            title="Ctrl+S"
            className={btnPrimary}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div
          role="tablist"
          aria-label="Type of work"
          onKeyDown={onTabKey}
          className="mb-5 inline-grid grid-cols-4 rounded-full bg-panel p-1 ring-1 ring-line"
        >
          {CATS.map((c) => {
            const on = c.id === tab;
            const errs = errorCount(c.id);
            return (
              <button
                key={c.id}
                id={`admin-tab-${c.id}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="admin-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => switchTab(c.id)}
                className={`h-10 rounded-full px-5 text-sm font-semibold transition-colors motion-reduce:transition-none ${on ? "bg-brand text-navy" : "text-muted hover:text-ink"}`}
              >
                {c.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {rows[c.id].length}
                </span>
                {errs > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-700 px-1.5 text-xs text-white">
                    {errs}
                    <span className="sr-only"> errors</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="admin-panel"
          aria-labelledby={`admin-tab-${tab}`}
        >
          <Dropzone
            key={tab}
            cat={tab}
            ffmpeg={ffmpeg}
            mode={modes[tab]}
            onMode={(m) => setModes((x) => ({ ...x, [tab]: m }))}
            onAdd={(r) => add(tab, r)}
            onSize={setSize}
          />

          {sel.size > 0 && (
            <BulkBar
              key={tab}
              cat={tab}
              count={sel.size}
              onApply={bulkApply}
              onMoveTo={(to) => void moveTo(tab, to)}
              onDelete={() => remove(tab, sel)}
              onClear={() => setSel(new Set())}
            />
          )}

          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                disabled={!list.length}
                checked={list.length > 0 && sel.size === list.length}
                ref={(el) => {
                  if (el)
                    el.indeterminate = sel.size > 0 && sel.size < list.length;
                }}
                onChange={(e) =>
                  setSel(
                    e.target.checked
                      ? new Set(list.map((r) => r.key))
                      : new Set(),
                  )
                }
              />
              Select all
            </label>
            <p className="text-sm text-muted">
              {list.length} item{list.length === 1 ? "" : "s"}. Target image:{" "}
              {meta.target}.
            </p>
            {tab === "videos" && (
              <button
                type="button"
                className={`${btn} ml-auto`}
                onClick={() => {
                  const row: Row = {
                    key: uid(),
                    v: {
                      title: "",
                      thumbnail: "",
                      href: "",
                      meta: "",
                      duration: "",
                    },
                  };
                  add("videos", row);
                  setOpen((o) => new Set(o).add(row.key));
                }}
              >
                Add external link
              </button>
            )}
            {tab === "projects" && (
              <button
                type="button"
                className={`${btn} ml-auto`}
                onClick={() => {
                  const row: Row = {
                    key: uid(),
                    v: {
                      title: "",
                      description: "",
                      image: "",
                      domain: "",
                      url: "",
                      duration: "",
                      role: "",
                      year: String(new Date().getFullYear()),
                      stack: [],
                    },
                  };
                  add("projects", row);
                  setOpen((o) => new Set(o).add(row.key));
                }}
              >
                Add project
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <p className="rounded-xl bg-panel p-8 text-center text-muted ring-1 ring-line">
              Nothing here yet. Drop files above to add{" "}
              {meta.label.toLowerCase()}.
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map((row, i) => (
                <RowItem
                  key={row.key}
                  cat={tab}
                  row={row}
                  index={i}
                  count={list.length}
                  selected={sel.has(row.key)}
                  open={open.has(row.key)}
                  issues={issues[row.key]}
                  bytes={sizes[str(row.v, meta.imageKey)]}
                  dropTarget={
                    overKey === row.key &&
                    drag.current !== null &&
                    drag.current !== row.key
                  }
                  onSelect={(on) =>
                    setSel((s) => {
                      const n = new Set(s);
                      if (on) n.add(row.key);
                      else n.delete(row.key);
                      return n;
                    })
                  }
                  onToggle={() =>
                    setOpen((o) => {
                      const n = new Set(o);
                      if (!n.delete(row.key)) n.add(row.key);
                      return n;
                    })
                  }
                  onPatch={(p) => patch(tab, row.key, p)}
                  onMove={(d) =>
                    i + d >= 0 && i + d < list.length && reorder(tab, i, i + d)
                  }
                  onDelete={() => remove(tab, new Set([row.key]))}
                  onReplace={(f) => void replace(tab, row, f)}
                  onDims={(src, w, h) =>
                    setDims((m) =>
                      m[src]?.w === w && m[src]?.h === h
                        ? m
                        : { ...m, [src]: { w, h } },
                    )
                  }
                  onDragStart={() => (drag.current = row.key)}
                  onDragOver={() => drag.current && setOverKey(row.key)}
                  onDrop={() => {
                    const from = list.findIndex((r) => r.key === drag.current);
                    if (from >= 0 && from !== i) reorder(tab, from, i);
                    drag.current = null;
                    setOverKey(null);
                  }}
                  onDragEnd={() => {
                    drag.current = null;
                    setOverKey(null);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4"
      >
        {toast && (
          <div className="pointer-events-auto flex max-w-xl items-center gap-3 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-lg ring-1 ring-white/20">
            <span>{toast.msg}</span>
            {toast.undo && (
              <button
                type="button"
                className="font-semibold text-brand underline underline-offset-4"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Undo
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              className="text-white/70 hover:text-white"
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}
