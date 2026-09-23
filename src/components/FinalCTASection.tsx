import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, HelpCircle, MessageCircle } from 'lucide-react';

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
      className="bg-black px-4 sm:px-6 pt-6 sm:pt-10 md:pt-12 pb-6 sm:pb-10 md:pb-12 relative"
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
            {/* Icon badge */}
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
                <MessageCircle size={20} />
              </div>
              <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
                HAZIRSAN
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-4xl md:text-5xl text-white font-serif tracking-tight leading-[1.15] mb-4">
              Kendinle daha açık bir{' '}
              <br className="hidden sm:inline" />
              <em className="italic text-white/80 font-serif">
                sohbete başlayalım.
              </em>
            </h2>

            {/* Supporting copy */}
            <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8 font-light px-2">
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
                className="rounded-full px-8 sm:px-10 py-4 bg-white text-black font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-white/90 transition-all cursor-pointer shadow-xl border border-white whitespace-nowrap shrink-0"
              >
                <span className="whitespace-nowrap">Görüşme Planla</span>
                <ArrowRight size={18} className="shrink-0" />
              </motion.button>

              {/* Secondary text link */}
              <button
                id="final-cta-faq-btn"
                type="button"
                onClick={onOpenFAQ}
                className="text-white/70 hover:text-white text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 py-2 px-3 cursor-pointer underline underline-offset-4 decoration-white/20 hover:decoration-white whitespace-nowrap"
              >
                <HelpCircle size={16} className="text-white/50 shrink-0" />
                <span className="whitespace-nowrap">Önce merak ettiklerimi soracağım</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
