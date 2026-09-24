import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Lightbulb } from 'lucide-react';

const PHILOSOPHY_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4';

export const PhilosophySection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  return (
    <section
      id="farkindalik-eylem"
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
            <Lightbulb size={20} />
          </div>
          <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
            FELSEFEM
          </span>
        </motion.div>

        {/* Main Section Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15] mb-8 md:mb-10 font-serif"
        >
          <span className="italic">Farkındalık</span>{' '}
          <span className="font-serif italic text-white/40 px-1 sm:px-2 font-normal">×</span>{' '}
          <span>Eylem</span>
        </motion.h2>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
          {/* Left Video */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl overflow-hidden aspect-[4/3] border border-white/10 shadow-2xl relative group bg-neutral-950"
          >
            <video
              src={PHILOSOPHY_VIDEO_URL}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-100 group-hover:scale-103 transition-transform duration-700"
            />
          </motion.div>

          {/* Right Text Blocks */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col space-y-6 sm:space-y-8 md:space-y-10 text-left"
          >
            {/* Block 1 */}
            <div className="space-y-3">
              <div className="text-white/60 text-xs sm:text-sm md:text-base tracking-[0.2em] uppercase font-semibold">
                NEREDESİN?
              </div>
              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                Değişim, bulunduğun yeri dürüstçe görebildiğinde başlar. Nelerin seni beslediğini, nelerin tükettiğini ve hangi düşüncelerin artık sana hizmet etmediğini birlikte görünür hâle getiririz.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/10" />

            {/* Block 2 */}
            <div className="space-y-3">
              <div className="text-white/60 text-xs sm:text-sm md:text-base tracking-[0.2em] uppercase font-semibold">
                NEREYE GİTMEK İSTİYORSUN?
              </div>
              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                Farkındalık tek başına yeterli değildir. Sana ait hedefleri netleştirir, büyük değişimleri sürdürülebilir küçük adımlara böler ve düşünceden harekete geçen bir yapı oluştururuz.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
