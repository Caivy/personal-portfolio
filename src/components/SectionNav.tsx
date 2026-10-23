import { useEffect, useRef, useState, type ReactNode } from "react";

/* Inline Lucide-style icons so there is no extra dependency. */
const icon = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="shrink-0"
  >
    {children}
  </svg>
);

const items = [
  {
    id: "hero",
    label: "Home",
    icon: icon(
      <>
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>,
    ),
  },
  {
    id: "about",
    label: "About",
    icon: icon(
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>,
    ),
  },
  {
    id: "work",
    label: "Work",
    icon: icon(
      <>
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect width="20" height="14" x="2" y="6" rx="2" />
      </>,
    ),
  },
  {
    id: "experience",
    label: "Experience",
    icon: icon(
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>,
    ),
  },
  {
    id: "skills",
    label: "Skills",
    icon: icon(<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />),
  },
  {
    id: "education",
    label: "Education",
    icon: icon(
      <>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </>,
    ),
  },
  {
    id: "contact",
    label: "Contact",
    icon: icon(
      <>
        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
        <rect x="2" y="4" width="20" height="16" rx="2" />
      </>,
    ),
  },
];

/**
 * Desktop: a vertical timeline on the right edge. Icons sit on a line that fills
 * with brand colour as you scroll; the current section's name is always shown,
 * and any other label appears on hover/focus.
 * Mobile: a compact top-right button showing the current section; tap to open
 * a list of every section (the bottom edge belongs to ContactDock).
 */
export function SectionNav() {
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === active),
  );
  // While a click-initiated smooth scroll is running, ignore the observer so the
  // highlight doesn't flicker through every section on the way.
  const lockUntil = useRef(0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (performance.now() < lockUntil.current) return;
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setActive(id);
    lockUntil.current = performance.now() + (reduce ? 0 : 900);
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      {/* ---------- Desktop timeline rail ---------- */}
      <nav
        aria-label="Sections"
        className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 md:block"
      >
        <div className="relative flex flex-col gap-3">
          {/* Track + progress line running through the icon centres (echoes the CV timeline) */}
          <span
            aria-hidden
            className="absolute bottom-5 left-1/2 top-5 w-0.5 -translate-x-1/2 rounded-full bg-line"
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-5 w-0.5 -translate-x-1/2 rounded-full bg-brand transition-[height] duration-500 ease-out motion-reduce:transition-none"
            style={{
              height: `calc((100% - 2.5rem) * ${activeIndex / (items.length - 1)})`,
            }}
          />

          {items.map(({ id, label, icon }, i) => {
            const on = i === activeIndex;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                aria-label={label}
                aria-current={on ? "true" : undefined}
                className={`group/item relative flex size-10 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                  on
                    ? "bg-brand text-navy shadow-lg"
                    : i < activeIndex
                      ? "bg-surface text-ink ring-2 ring-brand"
                      : "bg-surface text-muted ring-1 ring-line hover:text-ink hover:ring-brand"
                }`}
              >
                {icon}
                {/* Label chip sits outside the rail: always on for the current section, on hover/focus for the rest */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold shadow-md transition duration-200 motion-reduce:transition-none ${
                    on
                      ? "bg-brand text-navy opacity-100"
                      : "translate-x-1 bg-ink text-surface opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100"
                  }`}
                >
                  {label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* ---------- Mobile: top-right menu (bottom is reserved for ContactDock) ---------- */}
      <div className="fixed right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-30 md:hidden">
        {open && (
          <div
            aria-hidden
            className="fixed inset-0 -z-10"
            onClick={() => setOpen(false)}
          />
        )}

        <button
          type="button"
          aria-expanded={open}
          aria-controls="section-menu"
          aria-label="Sections menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3.5 text-sm font-semibold text-ink shadow-lg ring-1 ring-line"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-navy">
            {items[activeIndex].icon}
          </span>
          {items[activeIndex].label}
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`text-muted transition-transform duration-200 motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <nav
          id="section-menu"
          aria-label="Sections"
          className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-line transition duration-200 motion-reduce:transition-none ${
            open
              ? "visible scale-100 opacity-100"
              : "invisible scale-95 opacity-0"
          }`}
        >
          {items.map(({ id, label, icon }, i) => {
            const on = i === activeIndex;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                aria-current={on ? "true" : undefined}
                className={`flex h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold ${
                  on ? "bg-brand text-navy" : "text-ink active:bg-panel"
                }`}
              >
                {icon}
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
}
