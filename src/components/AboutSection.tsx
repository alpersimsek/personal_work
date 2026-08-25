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
      id="hakkimda"
      ref={ref}
      className="bg-black py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.04)_0%,_transparent_70%)] relative"
    >
      <div className="max-w-6xl mx-auto text-left">
        {/* Sub-label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/40 text-xs sm:text-sm tracking-[0.25em] uppercase mb-4 sm:mb-6 font-medium"
        >
          YOLCULUK
        </motion.div>

        {/* Main Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.15] tracking-tight font-serif max-w-5xl"
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
          className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10 text-white/60 text-sm md:text-base leading-relaxed"
        >
          <div>
            <h4 className="text-white text-xs uppercase tracking-wider mb-2 font-medium">01 / Sadeleşme</h4>
            <p>Sürekli bir şeylere yetişme telaşı yerine, enerjini gerçekten tüketen yükleri fark edip bırakmayı deneyimle.</p>
          </div>
          <div>
            <h4 className="text-white text-xs uppercase tracking-wider mb-2 font-medium">02 / Kendi Ritmin</h4>
            <p>Başkalarının başarı tanımlarını değil, kendi yaşam ritmini ve iç sesini merkeze alan bir yol haritası kur.</p>
          </div>
          <div>
            <h4 className="text-white text-xs uppercase tracking-wider mb-2 font-medium">03 / Gerçek Eylem</h4>
            <p>Büyük ve yorucu kararlar yerine, her gün hayatında kalıcı izler bırakan zarif ve sürdürülebilir adımlar at.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
