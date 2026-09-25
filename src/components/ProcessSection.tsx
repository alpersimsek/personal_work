import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Route } from 'lucide-react';
import { PROCESS_STEPS } from '../../server/content/programs';

const STEPS = PROCESS_STEPS;

export const ProcessSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  return (
    <section
      id="surec"
      ref={ref}
      className="bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 overflow-hidden relative"
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Icon badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-3 mb-4 sm:mb-6"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
            <Route size={20} />
          </div>
          <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
            SÜREÇ
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15] font-serif mb-8 md:mb-10"
        >
          Her değişimin bir{' '}
          <em className="font-serif italic text-white/60 font-normal">
            başlangıç noktası
          </em>{' '}
          vardır.
        </motion.h2>

        {/* Steps List */}
        <div className="space-y-0">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.7,
                delay: 0.15 + idx * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="border-t border-white/10 py-6 sm:py-8 flex flex-col items-center text-center gap-2 sm:gap-3 md:grid md:grid-cols-12 md:gap-8 md:items-center md:text-center group hover:bg-white/[0.01] transition-colors"
            >
              {/* Step Number */}
              <div className="md:col-span-2 text-white/50 group-hover:text-white/80 transition-colors font-mono text-sm sm:text-base font-semibold tracking-wider">
                {step.number}
              </div>

              {/* Step Title */}
              <div className="md:col-span-4 text-xl sm:text-2xl md:text-3xl text-white font-serif tracking-tight">
                {step.title}
              </div>

              {/* Step Description */}
              <div className="md:col-span-6 max-w-2xl md:max-w-none text-white/80 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                {step.description}
              </div>
            </motion.div>
          ))}
          <div className="border-t border-white/10" />
        </div>
      </div>
    </section>
  );
};
