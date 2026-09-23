import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PersonalMessageSectionProps {
  onOpenBooking: () => void;
}

export const PersonalMessageSection: React.FC<PersonalMessageSectionProps> = ({
  onOpenBooking,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  return (
    <section
      ref={ref}
      className="bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase mb-6 sm:mb-8 flex items-center justify-center gap-2 font-semibold"
        >
          <Sparkles size={15} className="text-white/70" />
          <span>KENDİNE DÖNMEK</span>
        </motion.div>

        {/* Main Emotional Statement */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-4xl md:text-5xl text-white font-serif leading-[1.15] tracking-tight mb-6 sm:mb-8"
        >
          <span>Belki de ihtiyacın olan şey yeni bir hayat değil.</span>
          <br />
          <em className="italic text-white/80 font-serif block mt-2">
            Kendine daha ait bir hayat.
          </em>
        </motion.div>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light mb-8 sm:mb-12 px-2"
        >
          Bazen tek bir doğru soru, uzun süredir baktığın bir şeyi tamamen farklı görmene yeter.
        </motion.p>

        {/* Large CTA Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center px-2"
        >
          <motion.button
            id="personal-message-booking-cta"
            onClick={onOpenBooking}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="liquid-glass rounded-full pl-7 sm:pl-9 pr-3 py-3.5 sm:py-4 flex items-center justify-between gap-4 text-white text-sm sm:text-base md:text-lg font-semibold hover:bg-white/10 transition-all cursor-pointer border border-white/25 shadow-2xl group w-full max-w-md"
          >
            <span className="text-white/95 font-semibold truncate">Tanışma Görüşmesi Planla</span>
            <div className="bg-white rounded-full p-2.5 sm:p-3 text-black flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:translate-x-1 shrink-0">
              <ArrowRight size={18} />
            </div>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
