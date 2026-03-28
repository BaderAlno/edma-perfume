"use client";

import { useEffect, useRef, useState } from "react";

interface RevealOptions {
  /** Fraction of element visible before triggering (default 0.1) */
  threshold?: number;
  /** Root margin — shrinks the trigger zone from the bottom (default "-40px") */
  rootMargin?: string;
}

/**
 * Attach the returned `ref` to any DOM element.
 * `isVisible` flips to `true` exactly once when the element enters the viewport
 * (IntersectionObserver with `unobserve` after first intersection).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // fire once only
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, isVisible] as const;
}
