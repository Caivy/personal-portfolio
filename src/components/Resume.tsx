import { profile } from "../data";
import { Button } from "./Button";
import { Section } from "./Section";

export function Resume() {
  return (
    <Section id="cv" title="Résumé">
      <div className="flex flex-col gap-3.5 rounded-2xl bg-panel p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-extrabold">Full CV</h3>
          <p className="text-muted">One page, PDF.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href={profile.cvUrl} target="_blank" rel="noopener">View CV</Button>
          <Button href={profile.cvUrl} variant="ghost" download>Download</Button>
        </div>
      </div>
    </Section>
  );
}
