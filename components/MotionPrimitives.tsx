"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useInView,
  useReducedMotion
} from "framer-motion";

export const premiumEase = [0.22, 1, 0.36, 1] as const;
export const springTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34
} as const;

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

export function PageMotion({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <m.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: premiumEase }}
    >
      {children}
    </m.div>
  );
}

export function MotionCard({
  as = "article",
  children,
  className,
  delay = 0,
  title
}: {
  as?: "article" | "div" | "section";
  children: React.ReactNode;
  className?: string;
  delay?: number;
  title?: string;
}) {
  const reducedMotion = useReducedMotion();
  const Component = m[as];

  return (
    <Component
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 6 }}
      transition={{ duration: 0.22, ease: premiumEase, delay: reducedMotion ? 0 : delay }}
      title={title}
    >
      {children}
    </Component>
  );
}

export function MotionList({ children }: { children: React.ReactNode }) {
  return <AnimatePresence mode="popLayout">{children}</AnimatePresence>;
}

export function MotionPress({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <m.span
      className={className}
      whileHover={reducedMotion ? undefined : { y: -1 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={springTransition}
      style={{ display: "inline-flex" }}
    >
      {children}
    </m.span>
  );
}

export function AnimatedCounter({
  value,
  formatter = (input) => String(Math.round(input))
}: {
  value: number;
  formatter?: (value: number) => string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    if (!isInView) {
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const duration = 520;

    function animate(timestamp: number) {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, reducedMotion, value]);

  return <span ref={ref}>{formatter(displayValue)}</span>;
}
