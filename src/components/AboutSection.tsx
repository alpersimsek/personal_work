import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

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
      <div className="max-w-6xl mx-auto text-center sm:text-left">
        {/* Sub-label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase mb-3 sm:mb-4 font-semibold text-center sm:text-left"
        >
          YOLCULUK
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight font-serif max-w-5xl text-center sm:text-left mx-auto sm:mx-0"
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
          className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-8 border-t border-white/10 text-white/80 text-sm sm:text-base md:text-lg leading-relaxed font-light"
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
