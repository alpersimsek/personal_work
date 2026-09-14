import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const STEPS = [
  {
    number: '01',
    title: 'Tanışma',
    description:
      'Kısa bir ön görüşmeyle bulunduğun noktayı, beklentilerini ve birlikte çalışmanın sana uygun olup olmadığını konuşuruz.',
  },
  {
    number: '02',
    title: 'Netleşme',
    description:
      'Hedeflerinin altında gerçekten ne olduğunu keşfeder, önündeki engelleri ve tekrar eden düşünce kalıplarını birlikte görünür hâle getiririz.',
  },
  {
    number: '03',
    title: 'Harekete Geçme',
    description:
      'İçgörüyü günlük hayatına taşıyabileceğin somut adımlara dönüştürür, ilerlemeyi birlikte takip ederiz.',
  },
];

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
      className="bg-black py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden relative"
    >
      <div className="max-w-6xl mx-auto text-left">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/40 text-xs sm:text-sm tracking-[0.2em] uppercase font-medium mb-3 sm:mb-4"
        >
          SÜREÇ
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl text-white tracking-tight font-serif mb-12 sm:mb-16 md:mb-20 max-w-3xl"
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
              className="border-t border-white/10 py-6 sm:py-10 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-8 items-baseline group hover:bg-white/[0.01] transition-colors"
            >
              {/* Step Number */}
              <div className="md:col-span-2 text-white/30 group-hover:text-white/60 transition-colors font-mono text-xs sm:text-sm tracking-wider">
                {step.number}
              </div>

              {/* Step Title */}
              <div className="md:col-span-4 text-xl sm:text-2xl md:text-3xl text-white font-serif tracking-tight">
                {step.title}
              </div>

              {/* Step Description */}
              <div className="md:col-span-6 text-white/60 text-sm sm:text-base leading-relaxed font-light">
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
