import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, HelpCircle } from 'lucide-react';

interface FinalCTASectionProps {
  onOpenBooking: () => void;
  onOpenFAQ: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onOpenBooking,
  onOpenFAQ,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  return (
    <section
      id="iletisim"
      ref={ref}
      className="bg-black px-4 sm:px-6 pb-16 sm:pb-24 md:pb-28 relative"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-glass rounded-[2rem] px-5 py-12 sm:px-10 sm:py-16 md:px-16 md:py-20 text-center relative overflow-hidden border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent shadow-2xl"
        >
          {/* Subtle internal glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Label */}
            <div className="text-white/40 text-xs sm:text-sm tracking-[0.25em] uppercase font-medium mb-4 sm:mb-6">
              HAZIRSAN
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-serif tracking-tight leading-[1.1] mb-5 sm:mb-6">
              Kendinle daha açık bir{' '}
              <br className="hidden sm:inline" />
              <em className="italic text-white/80 font-serif">
                sohbete başlayalım.
              </em>
            </h2>

            {/* Supporting copy */}
            <p className="text-white/60 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10 font-light px-2">
              İlk görüşme, birbirimizi tanımak ve birlikte çalışmanın sana uygun olup olmadığını görmek için.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-xl mx-auto">
              {/* Primary CTA button */}
              <motion.button
                id="final-cta-booking-btn"
                onClick={onOpenBooking}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="liquid-glass rounded-full px-7 sm:px-8 py-3.5 bg-white text-black font-medium text-sm sm:text-base flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-white/90 transition-all cursor-pointer shadow-xl border border-white whitespace-nowrap shrink-0"
              >
                <span className="whitespace-nowrap">Görüşme Planla</span>
                <ArrowRight size={16} className="shrink-0" />
              </motion.button>

              {/* Secondary text link */}
              <button
                id="final-cta-faq-btn"
                type="button"
                onClick={onOpenFAQ}
                className="text-white/60 hover:text-white text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white whitespace-nowrap"
              >
                <HelpCircle size={15} className="text-white/40 shrink-0" />
                <span className="whitespace-nowrap">Önce merak ettiklerimi soracağım</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
