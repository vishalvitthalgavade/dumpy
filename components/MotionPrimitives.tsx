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

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

export function PageMotion({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <m.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: premiumEase }}
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
  const Component = m[as];

  return (
    <Component
      className={className}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.15,
        ease: premiumEase,
        layout: { duration: 0.25, ease: premiumEase },
        opacity: { duration: 0.2, delay },
        y: { duration: 0.2, delay }
      }}
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
  return (
    <m.span
      className={className}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: premiumEase }}
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
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) {
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const duration = 650;

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
  }, [isInView, value]);

  return <span ref={ref}>{formatter(displayValue)}</span>;
}
