"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "cn";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 12,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reveal = () => {
      element.dataset.revealState = "visible";
      observer.disconnect();
    };
    // Above-the-fold content never waits for animation or JavaScript to be visible.
    if (
      motion.matches ||
      !("IntersectionObserver" in window) ||
      element.getBoundingClientRect().top < window.innerHeight
    ) {
      element.dataset.revealState = "visible";
      return;
    }
    element.dataset.revealState = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(element);
    const onMotionChange = () => {
      if (motion.matches) reveal();
    };
    motion.addEventListener("change", onMotionChange);
    // Keyboard focus must not land on invisible controls below the viewport.
    element.addEventListener("focusin", reveal);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotionChange);
      element.removeEventListener("focusin", reveal);
      delete element.dataset.revealState;
    };
  }, []);

  const style = {
    "--reveal-delay": `${Math.min(160, Math.max(0, delay))}ms`,
    "--reveal-distance": `${Math.min(20, Math.max(0, distance))}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className={cn("scroll-reveal", className)} style={style}>
      {children}
    </div>
  );
}
