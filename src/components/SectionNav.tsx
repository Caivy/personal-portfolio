import { useEffect, useState } from "react";

const items = [
  ["hero", "Home"],
  ["about", "About"],
  ["work", "Work"],
  ["experience", "Experience"],
  ["skills", "Skills"],
  ["education", "Education"],
  ["contact", "Contact"],
] as const;

/** Dots on the right edge: shows where you are, tap to jump (echoes the CV's timeline dots). */
export function SectionNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    items.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Sections"
      className="fixed right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col md:right-3"
    >
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          title={label}
          aria-label={label}
          aria-current={active === id ? "true" : undefined}
          className="p-1.5"
        >
          <span
            className={`block w-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
              active === id ? "h-6 bg-brand" : "h-2 bg-slate-400/70"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
