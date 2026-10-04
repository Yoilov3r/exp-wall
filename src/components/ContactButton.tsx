import { ArrowUpRight } from "lucide-react";
import type { AnchorHTMLAttributes } from "react";

type ContactButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  compact?: boolean;
};

export function ContactButton({
  className = "",
  compact = false,
  children = "联系我",
  ...props
}: ContactButtonProps) {
  return (
    <a
      className={[
        "contact-button group inline-flex items-center justify-center gap-2",
        "whitespace-nowrap rounded-full font-semibold uppercase leading-none tracking-[0.08em] text-white",
        compact
          ? "px-5 py-3 text-xs sm:px-6 sm:text-sm"
          : "px-6 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base",
        className,
      ].join(" ")}
      {...props}
    >
      <span>{children}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={2.25}
      />
    </a>
  );
}
