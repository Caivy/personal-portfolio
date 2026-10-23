import { skills } from "../data";
import { Section } from "./Section";

export function Skills() {
  return (
    <Section id="skills" title="Skills" tone="panel">
      <div className="grid gap-8 md:grid-cols-3">
        {skills.map((g) => (
          <div key={g.group}>
            <h3 className="mb-3 font-sans text-lg font-semibold">{g.group}</h3>
            <div className="grid gap-3.5">
              {g.items.map(([name, level]) => (
                <div key={name}>
                  <span className="mb-1 block text-[0.92rem]">{name}</span>
                  <div
                    role="img"
                    aria-label={`${name}: ${level} out of 100`}
                    className="h-2 overflow-hidden rounded bg-line"
                  >
                    <div
                      className="h-full origin-left rounded bg-brand animate-grow motion-reduce:animate-none"
                      style={{ width: `${level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
