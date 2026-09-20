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
  distance = 10,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    const reveal = (immediate = false) => {
      if (immediate) element.dataset.revealImmediate = "true";
      element.dataset.revealState = "visible";
      observer?.disconnect();
    };
    // Keep initial/near-viewport content visible; start other entrances before entry.
    if (
      motion.matches ||
      !("IntersectionObserver" in window) ||
      element.getBoundingClientRect().top < window.innerHeight + 64
    ) {
      reveal(true);
      return;
    }
    element.dataset.revealState = "pending";
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) reveal();
        // Fast scroll/anchor jumps may skip the intersection entirely.
        else if (entry.boundingClientRect.bottom <= 0) reveal(true);
      },
      { threshold: 0, rootMargin: "0px 0px 64px 0px" },
    );
    observer.observe(element);
    const onMotionChange = () => {
      if (motion.matches) reveal(true);
    };
    const onFocus = () => reveal(true);
    motion.addEventListener("change", onMotionChange);
    element.addEventListener("focusin", onFocus);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", onMotionChange);
      element.removeEventListener("focusin", onFocus);
      delete element.dataset.revealState;
      delete element.dataset.revealImmediate;
    };
  }, []);

  const style = {
    "--reveal-delay": `${Math.min(120, Math.max(0, delay))}ms`,
    "--reveal-distance": `${Math.min(16, Math.max(0, distance))}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className={cn("scroll-reveal", className)} style={style}>
      {children}
    </div>
  );
}
