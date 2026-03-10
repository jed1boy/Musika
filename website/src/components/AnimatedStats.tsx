"use client";

import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: "0", label: "Advertisements", isPercentage: false },
  { value: "100", label: "Open Source", isPercentage: true },
  { value: "∞", label: "Library Access", isPercentage: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (latest) => Math.round(latest));

  const target = parseInt(value, 10);

  useEffect(() => {
    if (isInView && !isNaN(target)) {
      animate(motionValue, target, { duration: 2.5, ease: "circOut" });
    }
  }, [isInView, target, motionValue]);

  if (value === "∞") {
    return <span>{value}</span>;
  }

  if (!isNaN(target)) {
    return <motion.span ref={ref} className="tabular-nums">{roundedValue}</motion.span>;
  }

  return <span>{value}</span>;
}

export function AnimatedStats() {
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
          className="flex flex-col items-center md:items-start text-center md:text-left group"
        >
          <div className="flex items-end mb-2 lg:mb-4 overflow-hidden">
            <motion.h3 
              className="text-[80px] lg:text-[140px] font-medium tracking-tighter leading-[0.8] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <StatValue value={stat.value} />
            </motion.h3>
            {stat.isPercentage && (
              <span className="text-4xl lg:text-6xl text-white/30 font-light ml-2 mb-2 lg:mb-4">%</span>
            )}
          </div>
          <p className="text-sm lg:text-lg text-white/40 font-medium tracking-[0.2em] uppercase pl-1 group-hover:text-white/70 transition-colors duration-500">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </motion.section>
  );
}