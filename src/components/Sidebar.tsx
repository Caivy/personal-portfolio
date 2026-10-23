import type { ReactNode } from "react";
import { education, languages, profile } from "../data";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="relative mb-3 pl-4 text-[1.4rem] font-extrabold before:absolute before:left-0 before:top-0.5 before:h-[22px] before:w-1.5 before:rounded-sm before:bg-brand">
        {title}
      </h2>
      <ul className="grid gap-3.5">{children}</ul>
    </div>
  );
}
const link = "border-b border-slate-500 no-underline";
const Row = ({ name, detail }: { name: string; detail: string }) => (
  <li>
    <strong className="font-semibold">{name}</strong>
    <small className="block text-slate-300">{detail}</small>
  </li>
);

export function Sidebar() {
  return (
    <aside className="mt-2 bg-navy px-[22px] pb-11 pt-9 text-white lg:mt-0 lg:bg-transparent lg:p-0 lg:pt-14 lg:self-start">
      <div className="mx-auto grid max-w-[1080px] gap-8 lg:sticky lg:top-6 lg:rounded-2xl lg:bg-navy lg:p-7">
        <Block title="Contact">
          <li>
            <a className={link} href={`tel:${profile.tel}`}>
              {profile.phone}
            </a>
          </li>
          <li>
            <a className={link} href={profile.telegram}>
              Telegram
            </a>
          </li>
          <li>
            <a className={link} href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </li>
          <li>{profile.address}</li>
        </Block>
        <Block title="Education">
          {education.map((e) => (
            <Row key={e.name} {...e} />
          ))}
        </Block>
        <Block title="Languages">
          {languages.map((l) => (
            <Row key={l.name} {...l} />
          ))}
        </Block>
      </div>
    </aside>
  );
}
