import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { posters, prints, projects, videos } from "../data";
import { Section } from "./Section";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

type Media =
  | { kind: "image"; src: string; title: string }
  | { kind: "video"; src: string; poster?: string; title: string };

// `short` is the label used on narrow phones, where four full labels would not fit.
const tabs = [
  {
    id: "posts",
    label: "Social posts",
    short: "Social",
    count: posters.length,
  },
  { id: "print", label: "Print", short: "Print", count: prints.length },
  { id: "videos", label: "Video", short: "Video", count: videos.length },
  { id: "projects", label: "IT projects", short: "IT", count: projects.length },
] as const;
type TabId = (typeof tabs)[number]["id"];

/** Phones: swipe sideways. md+: a normal grid. Pass the column sizes in `className`. */
function Rail({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      aria-label={label}
      className={`-mr-[22px] grid grid-flow-col snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2.5 pr-[22px] md:mr-0 md:grid-flow-row md:gap-5 md:overflow-visible md:pr-0 ${className}`}
    >
      {children}
    </div>
  );
}

const PlayIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="currentColor"
    aria-hidden
  >
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** Native <dialog>: Esc closes, focus is trapped, backdrop click closes. */
function Lightbox({
  media,
  onClose,
}: {
  media: Media | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (media && !d.open) d.showModal();
    if (!media && d.open) d.close();
  }, [media]);

  // Stop the page scrolling behind the popup.
  useEffect(() => {
    if (!media) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [media]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={media?.title}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      className="m-auto max-h-[92svh] max-w-[94vw] overflow-visible bg-transparent p-0 text-white backdrop:bg-black/85 backdrop:backdrop-blur-sm"
    >
      {media && (
        <figure className="relative m-0 flex flex-col items-center gap-3">
          {media.kind === "image" ? (
            <img
              src={media.src}
              alt={media.title}
              className="max-h-[80svh] max-w-[94vw] rounded-xl object-contain"
            />
          ) : (
            <video
              src={media.src}
              poster={media.poster}
              controls
              autoPlay
              playsInline
              className="max-h-[80svh] max-w-[94vw] rounded-xl bg-black"
            />
          )}
          <figcaption className="text-sm font-semibold">
            {media.title}
          </figcaption>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className="absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-navy/85 text-white"
          >
            <CloseIcon />
          </button>
        </figure>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Social posts                                                        */
/* ------------------------------------------------------------------ */

// Stand-ins for posters that have no image yet.
const art = [
  "bg-navy before:bg-brand before:h-[60%]",
  "bg-brand before:bg-navy before:h-[46%]",
  "bg-sky before:left-[20%] before:top-[14%] before:h-[60%] before:w-[60%] before:rounded-full before:bg-navy before:bottom-auto before:skew-y-0",
];

function Posts({ onOpen }: { onOpen: (m: Media) => void }) {
  return (
    <Rail
      label="Social media posts, scroll sideways"
      className="auto-cols-[78%] sm:auto-cols-[44%] md:grid-cols-3 lg:grid-cols-4"
    >
      {posters.map((p, i) => (
        <figure key={p.title} className="m-0 snap-start">
          {p.image ? (
            <button
              type="button"
              aria-label={`View ${p.title} full size`}
              onClick={() =>
                onOpen({ kind: "image", src: p.image!, title: p.title })
              }
              className="block w-full cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-line transition-shadow hover:ring-2 hover:ring-brand"
            >
              <img
                src={p.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full object-cover"
              />
            </button>
          ) : (
            <div
              className={`relative aspect-[4/5] overflow-hidden rounded-2xl before:absolute before:-bottom-[8%] before:-left-[10%] before:w-[120%] before:-skew-y-12 after:absolute after:left-[12%] after:top-[12%] after:h-2.5 after:w-[42%] after:rounded-full after:bg-white/90 ${art[i % art.length]}`}
            />
          )}
          <figcaption className="mt-2.5">
            <span className="block font-semibold text-ink">{p.title}</span>
            {p.client && <span className="text-sm text-muted">{p.client}</span>}
          </figcaption>
        </figure>
      ))}
    </Rail>
  );
}

/* ------------------------------------------------------------------ */
/* Print                                                               */
/* ------------------------------------------------------------------ */

const printRatio = {
  portrait: "aspect-[210/297]", // A4 / A5 / flyers
  landscape: "aspect-[297/210]", // banners, certificates, name cards
  square: "aspect-square",
} as const;

/** Masonry columns so portrait and landscape pieces sit together without gaps. */
function Prints({ onOpen }: { onOpen: (m: Media) => void }) {
  return (
    <div className="columns-2 gap-3.5 md:columns-3 md:gap-5 lg:columns-4">
      {prints.map((p) => (
        <figure key={p.title} className="m-0 mb-3.5 break-inside-avoid md:mb-5">
          <button
            type="button"
            aria-label={`View ${p.title} full size`}
            onClick={() =>
              onOpen({ kind: "image", src: p.image, title: p.title })
            }
            className="block w-full cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-line transition-shadow hover:ring-2 hover:ring-brand"
          >
            <img
              src={p.image}
              alt=""
              loading="lazy"
              decoding="async"
              className={`${printRatio[p.ratio ?? "portrait"]} w-full object-cover`}
            />
          </button>
          <figcaption className="mt-2">
            <span className="block font-semibold text-ink">{p.title}</span>
            <span className="text-sm text-muted">
              {p.type}
              {p.size ? `, ${p.size}` : ""}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Video                                                               */
/* ------------------------------------------------------------------ */

function Videos({ onOpen }: { onOpen: (m: Media) => void }) {
  return (
    <Rail
      label="Videos, scroll sideways"
      className="auto-cols-[86%] sm:auto-cols-[58%] md:grid-cols-2 lg:grid-cols-3"
    >
      {videos.map((v) => {
        const { src, href } = v;
        const thumb = (
          <>
            <img
              src={v.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-video w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 grid place-items-center bg-navy/25"
            >
              <span className="grid size-14 place-items-center rounded-full bg-brand pl-0.5 text-navy shadow-lg">
                <PlayIcon />
              </span>
            </span>
            {v.duration && (
              <span className="absolute bottom-2 right-2 rounded-md bg-navy/90 px-1.5 py-0.5 text-xs font-semibold text-white">
                {v.duration}
              </span>
            )}
          </>
        );
        const cls =
          "relative block w-full overflow-hidden rounded-2xl text-left ring-1 ring-line transition-shadow hover:ring-2 hover:ring-brand";

        return (
          <figure key={v.title} className="m-0 snap-start">
            {src ? (
              <button
                type="button"
                aria-label={`Play ${v.title}`}
                className={cls}
                onClick={() =>
                  onOpen({
                    kind: "video",
                    src,
                    poster: v.thumbnail,
                    title: v.title,
                  })
                }
              >
                {thumb}
              </button>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch ${v.title} (opens in a new tab)`}
                className={cls}
              >
                {thumb}
              </a>
            )}
            <figcaption className="mt-2.5">
              <span className="block font-semibold text-ink">{v.title}</span>
              {v.meta && <span className="text-sm text-muted">{v.meta}</span>}
            </figcaption>
          </figure>
        );
      })}
    </Rail>
  );
}

/* ------------------------------------------------------------------ */
/* IT projects                                                         */
/* ------------------------------------------------------------------ */

function Projects() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {projects.map((p) => (
        <article
          key={p.title}
          className="flex flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-line"
        >
          {/* Browser frame: the address bar carries the real domain */}
          <div className="flex items-center gap-1.5 border-b border-line bg-panel px-3 py-2">
            <span aria-hidden className="size-2.5 rounded-full bg-line" />
            <span aria-hidden className="size-2.5 rounded-full bg-line" />
            <span aria-hidden className="size-2.5 rounded-full bg-line" />
            <span className="ml-2 min-w-0 truncate rounded-full bg-surface px-3 py-0.5 text-xs text-muted">
              {p.domain}
            </span>
          </div>
          <img
            src={p.image}
            alt={`Screenshot of ${p.title}`}
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover object-top"
          />

          <div className="flex flex-1 flex-col gap-4 p-5">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-1.5 max-w-[60ch] text-muted">{p.description}</p>
            </div>

            <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-muted">Time to build</dt>
                <dd className="font-semibold text-ink">{p.duration}</dd>
              </div>
              <div>
                <dt className="text-muted">My role</dt>
                <dd className="font-semibold text-ink">{p.role}</dd>
              </div>
              <div>
                <dt className="text-muted">Year</dt>
                <dd className="font-semibold text-ink">{p.year}</dd>
              </div>
            </dl>

            <ul className="flex flex-wrap gap-2" aria-label="Built with">
              {p.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-panel px-2.5 py-1 text-xs font-semibold text-ink"
                >
                  {s}
                </li>
              ))}
            </ul>

            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex w-fit items-center gap-1.5 font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4"
              >
                Visit site
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function Work() {
  const [tab, setTab] = useState<TabId>("posts");
  const [media, setMedia] = useState<Media | null>(null);

  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === tab);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    setTab(tabs[n].id);
    document.getElementById(`work-tab-${tabs[n].id}`)?.focus();
  };

  return (
    <Section id="work" title="Selected work" tone="panel">
      <div
        role="tablist"
        aria-label="Type of work"
        onKeyDown={onKey}
        className="mb-6 grid w-full grid-cols-4 rounded-full bg-surface p-1 ring-1 ring-line md:inline-grid md:w-auto"
      >
        {tabs.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              id={`work-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls="work-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`h-11 rounded-full px-2 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none md:px-6 ${
                on ? "bg-brand text-navy" : "text-muted hover:text-ink"
              }`}
            >
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="ml-1.5 hidden text-xs opacity-70 sm:inline">
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* min-height keeps the tab bar from jumping when a shorter tab is selected */}
      <div
        role="tabpanel"
        id="work-panel"
        aria-labelledby={`work-tab-${tab}`}
        className="min-h-[60svh]"
      >
        {tab === "posts" && <Posts onOpen={setMedia} />}
        {tab === "print" && <Prints onOpen={setMedia} />}
        {tab === "videos" && <Videos onOpen={setMedia} />}
        {tab === "projects" && <Projects />}
      </div>

      <Lightbox media={media} onClose={() => setMedia(null)} />
    </Section>
  );
}
