import { about, facts } from "../data";
import { Section } from "./Section";

export function About() {
  return (
    <Section id="about" title="About">
      <p className="max-w-[36ch] text-2xl font-semibold leading-snug md:text-4xl">
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
    </Section>
  );
}
