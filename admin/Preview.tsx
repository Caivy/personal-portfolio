import { str, tagsOf, type Cat, type Item } from "./types";

// Mirrors the markup and classes in src/components/Work.tsx.
const ratioCls = { portrait: "aspect-[210/297]", landscape: "aspect-[297/210]", square: "aspect-square" } as const;

export function Preview({ cat, v }: { cat: Cat; v: Item }) {
  const title = str(v, "title") || "Untitled";

  if (cat === "posts") {
    const img = str(v, "image");
    return (
      <figure className="m-0 w-44">
        {img ? (
          <img src={img} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover ring-1 ring-line" />
        ) : (
          <div className="aspect-[4/5] rounded-2xl bg-sky" />
        )}
        <figcaption className="mt-2.5">
          <span className="block font-semibold text-ink">{title}</span>
          {str(v, "client") && <span className="text-sm text-muted">{str(v, "client")}</span>}
        </figcaption>
      </figure>
    );
  }

  if (cat === "print") {
    const cls = ratioCls[str(v, "ratio") as keyof typeof ratioCls] ?? ratioCls.portrait;
    return (
      <figure className="m-0 w-52">
        <img src={str(v, "image")} alt="" className={`${cls} w-full rounded-xl object-cover ring-1 ring-line`} />
        <figcaption className="mt-2">
          <span className="block font-semibold text-ink">{title}</span>
          <span className="text-sm text-muted">
            {str(v, "type")}
            {str(v, "size") ? `, ${str(v, "size")}` : ""}
          </span>
        </figcaption>
      </figure>
    );
  }

  if (cat === "videos") {
    return (
      <figure className="m-0 w-72">
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-line">
          <img src={str(v, "thumbnail")} alt="" className="aspect-video w-full object-cover" />
          <span aria-hidden className="absolute inset-0 grid place-items-center bg-navy/25">
            <span className="grid size-14 place-items-center rounded-full bg-brand pl-0.5 text-navy shadow-lg">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
              </svg>
            </span>
          </span>
          {str(v, "duration") && (
            <span className="absolute bottom-2 right-2 rounded-md bg-navy/90 px-1.5 py-0.5 text-xs font-semibold text-white">{str(v, "duration")}</span>
          )}
        </div>
        <figcaption className="mt-2.5">
          <span className="block font-semibold text-ink">{title}</span>
          {str(v, "meta") && <span className="text-sm text-muted">{str(v, "meta")}</span>}
        </figcaption>
      </figure>
    );
  }

  return (
    <article className="flex w-96 max-w-full flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
      <div className="flex items-center gap-1.5 border-b border-line bg-panel px-3 py-2">
        <span aria-hidden className="size-2.5 rounded-full bg-line" />
        <span aria-hidden className="size-2.5 rounded-full bg-line" />
        <span aria-hidden className="size-2.5 rounded-full bg-line" />
        <span className="ml-2 min-w-0 truncate rounded-full bg-surface px-3 py-0.5 text-xs text-muted">{str(v, "domain")}</span>
      </div>
      <img src={str(v, "image")} alt="" className="aspect-[16/10] w-full object-cover object-top" />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted">{str(v, "description")}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
          <div>
            <dt className="text-muted">Time to build</dt>
            <dd className="font-semibold text-ink">{str(v, "duration")}</dd>
          </div>
          <div>
            <dt className="text-muted">My role</dt>
            <dd className="font-semibold text-ink">{str(v, "role")}</dd>
          </div>
          <div>
            <dt className="text-muted">Year</dt>
            <dd className="font-semibold text-ink">{str(v, "year")}</dd>
          </div>
        </dl>
        <ul className="flex flex-wrap gap-1.5" aria-label="Built with">
          {tagsOf(v).map((s) => (
            <li key={s} className="rounded-full bg-panel px-2 py-0.5 text-xs font-semibold text-ink">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
