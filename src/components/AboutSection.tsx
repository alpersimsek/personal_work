import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Footprints } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  return (
    <section
      id="yolculuk-felsefesi"
      ref={ref}
      className="bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.04)_0%,_transparent_70%)] relative"
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
            <Footprints size={20} />
          </div>
          <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
            YOLCULUK
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight font-serif max-w-none text-center mx-auto"
        >
          Hayatını değiştirmek her zaman daha fazlasını yapmakla başlamaz.{' '}
          <br className="hidden sm:inline" />
          <span className="block mt-2 sm:mt-4">
            Bazen önce{' '}
            <em className="text-white/60 italic font-serif">kendini duymayı</em>{' '}
            <em className="text-white/60 italic font-serif">öğrenmen gerekir.</em>
          </span>
        </motion.h2>

        {/* Quiet supporting narrative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-8 text-center border-t border-white/10 text-white/80 text-sm sm:text-base md:text-lg leading-relaxed font-light"
        >
          <div>
            <h4 className="text-white text-xs sm:text-sm uppercase tracking-wider mb-2.5 font-semibold">01 / Sadeleşme</h4>
            <p>Sürekli bir şeylere yetişme telaşı yerine, enerjini gerçekten tüketen yükleri fark edip bırakmayı deneyimle.</p>
          </div>
          <div>
            <h4 className="text-white text-xs sm:text-sm uppercase tracking-wider mb-2.5 font-semibold">02 / Kendi Ritmin</h4>
            <p>Başkalarının başarı tanımlarını değil, kendi yaşam ritmini ve iç sesini merkeze alan bir yol haritası kur.</p>
          </div>
          <div>
            <h4 className="text-white text-xs sm:text-sm uppercase tracking-wider mb-2.5 font-semibold">03 / Gerçek Eylem</h4>
            <p>Büyük ve yorucu kararlar yerine, her gün hayatında kalıcı izler bırakan zarif ve sürdürülebilir adımlar at.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
