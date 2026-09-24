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
        {/* Icon badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-3 mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
            <Sparkles size={20} />
          </div>
          <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
            KENDİNE DÖNMEK
          </span>
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
          className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl md:max-w-none mx-auto leading-relaxed font-light mb-8 sm:mb-12 px-2 md:whitespace-nowrap"
        >
          Bazen tek bir doğru soru, uzun süredir baktığın bir şeyi tamamen farklı görmene yeter.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center px-2"
        >
          <button
            id="personal-message-booking-cta"
            onClick={onOpenBooking}
            className="btn btn-primary btn-lg shrink-0"
          >
            <span className="whitespace-nowrap">Tanışma Görüşmesi Planla</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
