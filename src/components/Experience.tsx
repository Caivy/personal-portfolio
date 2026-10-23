import { experience } from "../data";
import { Section } from "./Section";

export function Experience() {
  return (
    <Section id="experience" title="Experience">
      {/* the CV timeline: a thin line with amber dots */}
      <div className="relative pl-[30px] before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-0.5 before:bg-line">
        {experience.map((job) => (
          <div
            key={job.title + job.period}
            className="relative mb-7 last:mb-0 before:absolute before:-left-[30px] before:top-2 before:size-3 before:rounded-full before:bg-brand before:shadow-[0_0_0_4px_var(--bg)]"
          >
            <h3 className="text-xl font-extrabold md:text-2xl">{job.title}</h3>
            <p className="mb-1.5 mt-0.5 text-sm text-muted">
              {job.org} · {job.period}
            </p>
            {job.summary && (
              <p className="max-w-[62ch] text-muted">{job.summary}</p>
            )}
            {job.points && (
              <ul className="mt-2 max-w-[62ch] list-disc space-y-1 pl-[18px] text-muted">
                {job.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
