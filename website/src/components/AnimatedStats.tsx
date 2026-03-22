"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useMemo } from "react";

const stats = [
  { value: "0", label: "Advertisements", isPercentage: false },
  { value: "100", label: "Open Source", isPercentage: true },
  { value: "∞", label: "Library Access", isPercentage: false },
];

function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (latest) => Math.round(latest));

  const target = parseInt(value, 10);

  useEffect(() => {
    if (!isInView || isNaN(target)) return;
    if (reduceMotion) {
      motionValue.set(target);
      return;
    }
    animate(motionValue, target, { duration: 2.5, ease: "circOut" });
  }, [isInView, target, motionValue, reduceMotion]);

  if (value === "∞") {
    return <span>{value}</span>;
  }

  if (!isNaN(target)) {
    return (
      <motion.span ref={ref} className="tabular-nums">
        {roundedValue}
      </motion.span>
    );
  }

  return <span>{value}</span>;
}

export function AnimatedStats() {
  const reduceMotion = useReducedMotion();

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: reduceMotion ? 0 : 0.05 },
      },
    }),
    [reduceMotion],
  );

  const itemVariants = useMemo(
    () =>
      reduceMotion
        ? {
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0 } },
          }
        : {
            hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { type: "spring" as const, stiffness: 100, damping: 20 },
            },
          },
    [reduceMotion],
  );

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="w-full flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24 mt-16 md:mt-32 mb-16 md:mb-32 py-16 lg:py-24 border-y border-white/10"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          variants={itemVariants}
          className="marketing-stat-block flex flex-col items-center md:items-start text-center md:text-left group"
        >
          <div className="flex items-end mb-2 lg:mb-4 overflow-hidden">
            <motion.h3
              className="text-[80px] lg:text-[140px] font-medium tracking-tighter leading-[0.8] text-transparent bg-clip-text bg-linear-to-b from-white to-white/40"
              whileHover={reduceMotion ? undefined : { y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <StatValue value={stat.value} />
            </motion.h3>
            {stat.isPercentage && (
              <span className="text-4xl lg:text-6xl text-white/30 font-light ml-2 mb-2 lg:mb-4">%</span>
            )}
          </div>
          <p className="marketing-stat-label text-sm lg:text-lg text-white/40 font-medium tracking-[0.2em] uppercase pl-1 transition-[color] duration-200 ease-out-ui">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </motion.section>
  );
}
