import { profile } from "../data";
import { Button } from "./Button";
import { PhoneIcon, TelegramIcon } from "./Icons";
import { Section } from "./Section";

export function Contact() {
  return (
    <Section id="contact" title="Let’s talk" tone="navy">
      <p className="mb-8 max-w-[30ch] text-xl text-slate-300 md:text-2xl">
        Reach me on Telegram, by phone or by email.
      </p>
      <div className="grid max-w-md gap-3">
        <Button href={profile.telegram}>
          <TelegramIcon /> Message on Telegram
        </Button>
        <Button href={`tel:${profile.tel}`} variant="ghost">
          <PhoneIcon /> {profile.phone}
        </Button>
        <Button href={`mailto:${profile.email}`} variant="ghost">
          {profile.email}
        </Button>
      </div>
      <p className="mt-8 text-slate-300">{profile.address}</p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-semibold">
        <a
          className="border-b-2 border-brand"
          href={profile.cvUrl}
          target="_blank"
          rel="noopener"
        >
          View CV
        </a>
        <a className="border-b-2 border-brand" href={profile.cvUrl} download>
          Download CV
        </a>
      </div>
      <p className="mt-14 text-sm text-slate-400">
        © {new Date().getFullYear()} {profile.name.join(" ")}
      </p>
    </Section>
  );
}
