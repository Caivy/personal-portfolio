import { useEffect, useRef, useState } from "react";
import { about, facts, profile } from "../data";
import { Section } from "./Section";

/*
 * ABOUT IMAGE: swap the placeholder for the real photo.
 *
 * 1. Export the photo as /public/about.webp, 4:5 portrait, 1080 x 1350.
 *    (Cut-out portrait on a transparent background also works: the amber
 *    plate behind it will show through.)
 * 2. Set USE_PLACEHOLDER to false.
 * 3. Edit `alt` to say what the photo actually shows.
 */
const USE_PLACEHOLDER = false;
const ABOUT_IMAGE = {
  src: "/about.webp",
  width: 1080,
  height: 1350,
  alt: `${profile.name.join(" ")} at work`,
};

// The top-right corner is cut at an angle, echoing the Hero's diagonal.
// Both the photo and the amber plate behind it use the same shape.
const CUT = "[clip-path:polygon(0_0,84%_0,100%_14%,100%_100%,0_100%)]";

/** True once the element has scrolled into view (and stays true). */
function useSeen<T extends Element>(threshold = 0.4) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

export function About() {
  const [figureRef, seen] = useSeen<HTMLElement>();

  return (
    <Section id="about" title="About">
      <div className="grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-14 lg:gap-20">
        <div>
          <p className="max-w-[36ch] text-2xl font-semibold leading-snug md:text-3xl lg:text-4xl">
            {about}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {facts.map((f) => (
              <li
                key={f}
                className="rounded-full border-2 border-brand px-4 py-1.5 text-sm font-semibold"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/*
          Image on the right, so the text stays on the left like the rest of the page. Width is driven by viewport height on desktop
          (44vh at 4:5 = 55vh tall), so the section still fits one snap screen.
          The extra bottom/right padding leaves room for the offset plate.
        */}
        <figure
          ref={figureRef}
          className="relative w-full pb-3 pr-3 sm:max-w-md md:w-[min(44vh,26rem)] md:max-w-none md:pb-5 md:pr-5"
        >
          {/* Amber plate, offset like a second ink layer slightly out of register. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 md:translate-x-5 md:translate-y-5"
          >
            {/* Slides into the offset once, the first time it is seen. Skipped when motion is reduced. */}
            <div
              className={`h-full w-full bg-brand ${CUT} transition-transform duration-700 ease-out motion-reduce:transition-none ${
                seen
                  ? ""
                  : "motion-safe:-translate-x-3 motion-safe:-translate-y-3 md:motion-safe:-translate-x-5 md:motion-safe:-translate-y-5"
              }`}
            />
          </div>

          <div
            className={`relative aspect-[4/5] overflow-hidden bg-sky ${CUT}`}
          >
            {USE_PLACEHOLDER ? (
              <div
                role="img"
                aria-label={`Placeholder for a photo: ${ABOUT_IMAGE.alt}`}
                className="h-full w-full bg-sky"
              />
            ) : (
              <img
                src={ABOUT_IMAGE.src}
                width={ABOUT_IMAGE.width}
                height={ABOUT_IMAGE.height}
                alt={ABOUT_IMAGE.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </figure>
      </div>
    </Section>
  );
}
