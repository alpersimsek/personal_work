import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialItem } from '../types';

const REFLECTIONS: TestimonialItem[] = [
  {
    quote:
      'Her gün kendimi bir şeylere yetişmek zorunda hissettiğim, zihnimin durmaksızın konuştuğu bir dönemde başladık. Seanslarda sadece "ne yapmalıyım"ı değil, "neden bu kadar acele ediyorum"u fark etmek hayatımın ritmini tamamen değiştirdi.',
    author: 'E. K.',
    role: 'Yazılım Mühendisi & Girişimci',
    theme: 'Netlik & Zihinsel Dinginlik',
    timeframe: '8 Seans',
  },
  {
    quote:
      'Büyük kararlar almaktan ve hata yapmaktan korktuğum için sürekli erteliyordum. Bana ne yapmam gerektiğini söylemeyen ama doğru sorularla kendi yanıtlarımı bulduran bir alanın olması en büyük güvencem oldu.',
    author: 'D. A.',
    role: 'Tasarım Direktörü',
    theme: 'Düşünceden Eyleme',
    timeframe: '10 Seans',
  },
  {
    quote:
      'Dışarıdan her şey yolunda görünürken içimdeki tükenmişliği ilk kez burada yargılanmadan ifade edebildim. Şimdi başkalarının beklentileriyle değil, kendi değerlerimle kurduğum bir rutinim var.',
    author: 'M. S.',
    role: 'Pazarlama Yöneticisi',
    theme: 'Kendi Ritmini Bulmak',
    timeframe: '12 Seans',
  },
];

export const ReflectionsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextReflection = () => {
    setActiveIndex((prev) => (prev + 1) % REFLECTIONS.length);
  };

  const prevReflection = () => {
    setActiveIndex((prev) => (prev - 1 + REFLECTIONS.length) % REFLECTIONS.length);
  };

  return (
    <section className="bg-black py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.02)_0%,_transparent_70%)]">
      <div className="max-w-6xl mx-auto text-left">
        {/* Label & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-14 gap-4">
          <div className="text-center md:text-left">
            <div className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-3 sm:mb-4 flex items-center justify-center md:justify-start gap-2">
              <Quote size={15} className="text-white/70" />
              <span>DANIŞAN YANSIMALARI</span>
            </div>
            <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15]">
              Yolculuğu birlikte yürüyenler ne hissetti?
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            <p className="text-white/70 text-sm sm:text-base max-w-md font-light leading-relaxed">
              Gizlilik prensibi gereği isimler kısaltılmıştır.
            </p>

            {/* Mobile Navigation Controls */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <button
                onClick={prevReflection}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer active:scale-95"
                aria-label="Önceki Yansıma"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextReflection}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer active:scale-95"
                aria-label="Sonraki Yansıma"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop View: 3 Column Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {REFLECTIONS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="liquid-glass rounded-3xl p-8 flex flex-col justify-between border border-white/10 hover:border-white/20 transition-all bg-black/40 shadow-xl group"
            >
              <div>
                {/* Theme Tag */}
                <div className="flex items-center justify-between gap-2 mb-6 min-h-[36px]">
                  <span className="text-xs uppercase tracking-wider text-white/80 font-mono font-medium px-3 py-1 rounded-full bg-white/5 border border-white/15 whitespace-nowrap">
                    {item.theme}
                  </span>
                  <span className="text-xs text-white/50 font-mono shrink-0 whitespace-nowrap">
                    {item.timeframe}
                  </span>
                </div>

                {/* Quote */}
                <p className="serif-font text-xl text-white/95 leading-relaxed italic mb-8 font-serif">
                  "{item.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white tracking-wide">
                    {item.author}
                  </div>
                  <div className="text-sm text-white/60 font-light mt-0.5">
                    {item.role}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                  <Heart size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile View: Animated Touch Carousel */}
        <div className="block md:hidden">
          <div className="relative overflow-hidden rounded-3xl min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_e, { offset, velocity }) => {
                  const swipe = offset.x;
                  if (swipe < -50 || velocity.x < -300) {
                    nextReflection();
                  } else if (swipe > 50 || velocity.x > 300) {
                    prevReflection();
                  }
                }}
                className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/15 bg-black/60 shadow-2xl cursor-grab active:cursor-grabbing touch-pan-y select-none min-h-[320px]"
              >
                <div>
                  {/* Theme Tag */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span className="text-xs uppercase tracking-wider text-white/90 font-mono font-medium px-3 py-1 rounded-full bg-white/10 border border-white/20 whitespace-nowrap">
                      {REFLECTIONS[activeIndex].theme}
                    </span>
                    <span className="text-xs text-white/60 font-mono shrink-0">
                      {REFLECTIONS[activeIndex].timeframe}
                    </span>
                  </div>

                  {/* Quote */}
                  <p className="serif-font text-base sm:text-lg text-white leading-relaxed italic mb-6 font-serif">
                    "{REFLECTIONS[activeIndex].quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold text-white tracking-wide">
                      {REFLECTIONS[activeIndex].author}
                    </div>
                    <div className="text-xs text-white/60 font-light mt-0.5">
                      {REFLECTIONS[activeIndex].role}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/80">
                    <Heart size={14} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Pagination Dots & Counter */}
          <div className="flex items-center justify-between mt-5 px-2">
            <span className="text-xs font-mono text-white/50">
              0{activeIndex + 1} / 0{REFLECTIONS.length}
            </span>

            <div className="flex items-center gap-2">
              {REFLECTIONS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    activeIndex === idx
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Yansıma ${idx + 1}`}
                />
              ))}
            </div>

            <span className="text-[11px] font-mono text-white/40">
              Parmağınızla kaydırın ← →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
