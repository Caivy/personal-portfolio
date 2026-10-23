import { profile } from "../data";
import { Button } from "./Button";
import { PhoneIcon, TelegramIcon } from "./Icons";

export function Hero() {
  const name = profile.name.join(" ");
  return (
    <header
      id="hero"
      className="relative flex min-h-svh snap-start flex-col overflow-hidden bg-navy px-[22px] pt-[calc(28px+env(safe-area-inset-top))] text-center text-white md:justify-center md:px-8 md:pb-12 md:text-left"
    >
      {/* CV corner cut: desktop only (on phones it would sit under the name) */}
      <div
        aria-hidden
        className="absolute left-0 top-0 hidden h-[230px] w-[44%] bg-brand [clip-path:polygon(0_0,100%_0,0_100%)] md:block"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1080px] md:max-w-[1080px]">
        <div className="md:max-w-[50%]">
          <h1 className="text-[clamp(3rem,min(16.5vw,9svh),7.4rem)] font-extrabold leading-[1.05] tracking-tight md:text-[clamp(3rem,min(9vw,10svh),7.4rem)]">
            {profile.name[0]}
            <br />
            {profile.name[1]}
          </h1>
          <p className="mb-1.5 mt-2 text-lg font-semibold text-brand md:mt-3">
            {profile.role}
          </p>
          <p className="mx-auto max-w-[34ch] text-sm text-slate-300 md:mx-0 md:text-base">
            {profile.lede}
          </p>

          {/* Desktop buttons (phones get the overlay group at the bottom) */}
          <div id="hero-cta" className="mt-6 hidden gap-3 md:flex">
            <Button href={profile.telegram}>
              <TelegramIcon /> Message on Telegram
            </Button>
            <Button
              href={`tel:${profile.tel}`}
              variant="ghost"
              className="text-white"
            >
              <PhoneIcon /> Call {profile.phone}
            </Button>
          </div>
        </div>
      </div>

      {/* The cutout. Phones: fills the space under the text, standing on the bottom edge.
          Desktop: pinned bottom-right, looking left toward the text.
          The amber circle stops the navy suit from blending into the navy hero. */}
      <div className="relative z-0 mt-3 min-h-[280px] flex-1 md:absolute md:bottom-0 md:right-[3%] md:mt-0 md:aspect-[970/1400] md:h-[min(86svh,70vw)] md:flex-none lg:right-[6%]">
        <div className="absolute bottom-0 left-1/2 aspect-[970/1400] h-full -translate-x-1/2 md:left-0 md:translate-x-0">
          <div
            aria-hidden
            className="absolute left-1/2 top-[12%] aspect-square w-[104%] -translate-x-1/2 rounded-full bg-brand"
          />
          <img
            src="/portrait-cutout.webp"
            width={970}
            height={1400}
            fetchPriority="high"
            alt={`Portrait of ${name}`}
            className="relative h-full w-full object-contain object-bottom"
          />
        </div>
      </div>

      {/* Phone buttons: sit over the bottom of the photo on a navy fade */}
      <div
        id="hero-cta-mobile"
        className="absolute inset-x-0 bottom-0 z-10 flex gap-3 bg-linear-to-t from-navy via-navy/85 to-transparent px-[22px] pb-[calc(24px+env(safe-area-inset-bottom))] pt-20 md:hidden"
      >
        <Button href={profile.telegram} className="flex-1 px-3">
          <TelegramIcon /> Telegram
        </Button>
        <Button
          href={`tel:${profile.tel}`}
          variant="ghost"
          className="flex-1 px-3 text-white"
        >
          <PhoneIcon /> Call
        </Button>
      </div>
    </header>
  );
}
