"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CloudOff, Mic2, Radio, ChevronDown, Music } from "lucide-react";

const features = [
  {
    id: "pure-sound",
    title: "Pure Sound.",
    description: "Stream seamlessly without a single interruption. We leverage the vast YouTube Music library and strip away everything that gets between you and your sound.",
    icon: Music,
  },
  {
    id: "offline",
    title: "Offline Mode.",
    description: "Download your entire library—tracks, albums, and playlists—with a dedicated, robust download manager. Never rely on cell towers again.",
    icon: CloudOff,
  },
  {
    id: "recognition",
    title: "Audio Recognition.",
    description: "Hear something you like in the wild? Identify songs playing around you instantly with advanced environment-aware aural recognition built directly into the client.",
    icon: Mic2,
  },
  {
    id: "sync",
    title: "Synced Lyrics.",
    description: "Real-time synchronized open-source lyrics. Understand the music, whatever the language.",
    icon: Radio,
  },
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState<string>(features[0].id);
  const reduceMotion = useReducedMotion();

  const accordionSpring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 120, damping: 20 };
  const chevronSpring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 200, damping: 20 };

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : { height: 0, opacity: 0 };
  const panelAnimate = reduceMotion
    ? { opacity: 1 }
    : { height: "auto", opacity: 1 };
  const panelExit = reduceMotion
    ? { opacity: 0 }
    : { height: 0, opacity: 0 };

  const iconInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.8, filter: "blur(10px)" };
  const iconAnimate = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, filter: "blur(0px)" };
  const iconExit = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 1.2, filter: "blur(10px)" };
  const iconTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 120, damping: 20 };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 md:gap-16 my-8 md:my-16">
      <div className="w-full lg:w-1/2 flex flex-col justify-center">
        {features.map((feature) => {
          const isActive = activeFeature === feature.id;
          return (
            <div
              key={feature.id}
              className={`marketing-feature-row flex flex-col border-b border-white/10 overflow-hidden cursor-pointer transition-[border-color] duration-200 ease-out-ui ${isActive ? "pb-8" : "pb-6"}`}
              onClick={() => setActiveFeature(isActive ? "" : feature.id)}
            >
              <div className="flex items-center justify-between pt-6 pb-2">
                <h3
                  className={`text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight transition-[color] duration-200 ease-out-ui ${isActive ? "text-white" : "text-white/30"}`}
                >
                  {feature.title}
                </h3>
                <motion.div
                  animate={{ rotate: isActive ? 180 : 0 }}
                  transition={chevronSpring}
                  className={`lg:hidden ${isActive ? "text-white" : "text-white/30"}`}
                >
                  <ChevronDown size={32} strokeWidth={1.5} />
                </motion.div>
              </div>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={panelInitial}
                    animate={panelAnimate}
                    exit={panelExit}
                    transition={accordionSpring}
                  >
                    <div className="pt-4 text-lg sm:text-xl md:text-2xl text-white/50 font-light leading-relaxed max-w-xl">
                      <div className="flex items-center gap-4 mb-6 lg:hidden">
                        <div className="w-14 h-14 bg-white/10 rounded-[18px] flex items-center justify-center">
                          <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                        </div>
                      </div>
                      {feature.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:flex w-1/2 aspect-square xl:aspect-[4/3] bg-white/[0.02] border border-white/10 rounded-[64px] items-center justify-center relative overflow-hidden sticky top-32">
        <AnimatePresence mode="wait">
          {features.map(
            (f) =>
              activeFeature === f.id && (
                <motion.div
                  key={f.id}
                  initial={iconInitial}
                  animate={iconAnimate}
                  exit={iconExit}
                  transition={iconTransition}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-50" />
                  <f.icon className="w-48 h-48 xl:w-64 xl:h-64 text-white/20 relative z-10" strokeWidth={1} />
                </motion.div>
              ),
          )}
          {!activeFeature && (
            <motion.div
              key="empty-state"
              initial={iconInitial}
              animate={iconAnimate}
              exit={iconExit}
              transition={iconTransition}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-50" />
              <span className="text-[180px] xl:text-[240px] font-bold tracking-tighter text-white/5 relative z-10 select-none leading-none">
                M.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
