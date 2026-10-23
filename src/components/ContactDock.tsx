import { useEffect, useState } from "react";
import { profile } from "../data";
import { Button } from "./Button";

/**
 * Fixed bottom bar on phones and tablets (hidden on desktop).
 * Hidden while the hero's buttons or the Contact section are on screen,
 * so it only appears in between.
 */
export function ContactDock() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target),
        );
        setHidden(onScreen.size > 0);
      },
      { threshold: 0.3 },
    );
    const targets = ["hero-cta", "hero-cta-mobile", "contact"].map((id) =>
      document.getElementById(id),
    );
    if (targets.every((t) => !t)) setHidden(false);
    targets.forEach((t) => t && io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Contact"
      className={`fixed inset-x-0 bottom-0 z-10 flex gap-2.5 bg-navy px-3.5 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-1px_0_#ffffff22] transition-[transform,visibility] duration-300 motion-reduce:transition-none lg:hidden ${
        hidden ? "invisible translate-y-full" : "visible translate-y-0"
      }`}
    >
      <Button href={profile.telegram} className="flex-1 px-3">
        Telegram
      </Button>
      <Button
        href={`tel:${profile.tel}`}
        variant="ghost"
        className="flex-1 px-3 text-white"
      >
        Call
      </Button>
    </nav>
  );
}
