"use client";

import type { ComponentProps } from "react";

/** Page-local disclosure navigation never creates a URL/history entry. */
export function SectionButton({
  target,
  ...props
}: ComponentProps<"button"> & { target: string }) {
  return (
    <button
      {...props}
      type="button"
      onClick={() => {
        const section = document.getElementById(target);
        if (!section) return;
        section.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
        section.focus({ preventScroll: true });
      }}
    />
  );
}
