import { education, languages } from "../data";
import { Section } from "./Section";

const List = ({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; detail: string }[];
}) => (
  <div>
    <h3 className="mb-4 text-xl font-extrabold">{title}</h3>
    <ul className="grid gap-4">
      {rows.map((r) => (
        <li key={r.name} className="border-l-4 border-brand pl-4">
          <strong className="block text-lg font-semibold">{r.name}</strong>
          <span className="text-muted">{r.detail}</span>
        </li>
      ))}
    </ul>
  </div>
);

export function Education() {
  return (
    <Section id="education" title="Education">
      <div className="grid gap-10 md:grid-cols-2">
        <List title="Schools" rows={education} />
        <List title="Languages" rows={languages} />
      </div>
    </Section>
  );
}
