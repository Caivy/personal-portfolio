import { work } from "../data";
import { Section } from "./Section";

const art = [
  "bg-navy before:bg-brand before:h-[60%]",
  "bg-brand before:bg-navy before:h-[46%]",
  "bg-sky before:left-[20%] before:top-[14%] before:h-[60%] before:w-[60%] before:rounded-full before:bg-navy before:bottom-auto before:skew-y-0",
];

export function Work() {
  return (
    <Section id="work" title="Selected work" tone="panel">
      <div
        tabIndex={0}
        aria-label="Design work, scroll sideways"
        className="-mr-[22px] grid auto-cols-[78%] grid-flow-col snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2.5 pr-[22px] md:mr-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:overflow-visible md:pr-0"
      >
        {work.map((w, i) => (
          <figure key={w.title} className="m-0 snap-start">
            {w.image ? (
              <img
                src={w.image}
                alt={w.title}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            ) : (
              <div
                className={`relative aspect-[4/5] overflow-hidden rounded-2xl before:absolute before:-bottom-[8%] before:-left-[10%] before:w-[120%] before:-skew-y-12 after:absolute after:left-[12%] after:top-[12%] after:h-2.5 after:w-[42%] after:rounded-full after:bg-white/90 ${art[i % art.length]}`}
              />
            )}
            <figcaption className="mt-2 text-sm text-muted">
              {w.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
