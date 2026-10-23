import type { ReactNode } from "react";

const tones = {
  plain: "bg-surface text-ink",
  panel: "bg-panel text-ink",
  navy: "bg-navy text-white",
};

/** One full-screen section: content is centered vertically and grows past the screen if it needs to. */
export function Section({
  id,
  title,
  tone = "plain",
  children,
}: {
  id: string;
  title: string;
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`flex min-h-svh snap-start flex-col justify-center px-5.5 py-20 md:px-8 ${tones[tone]}`}
    >
      <div className="mx-auto w-full max-w-270">
        <h2 className="mb-8 flex items-center gap-3 text-[2rem] font-extrabold tracking-tight md:text-5xl">
          <span aria-hidden className="h-8 w-3 shrink-0 rounded-md bg-brand" />
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
