import type { ReactNode } from "react";

type Props = { href: string; variant?: "fill" | "ghost"; className?: string; children: ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"
>;

const base =
  "inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border-2 px-6 font-semibold no-underline";
const variants = {
  fill: "border-brand bg-brand text-[#1d1d1d]",
  ghost: "border-current",
};

export function Button({ href, variant = "fill", className = "", children, ...rest }: Props) {
  return (
    <a href={href} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
