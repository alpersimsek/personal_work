import React from 'react';
import { motion } from 'motion/react';
import { Quote, Sparkles, CheckCircle, Heart } from 'lucide-react';
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
  return (
    <section className="bg-black py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.02)_0%,_transparent_70%)]">
      <div className="max-w-6xl mx-auto text-left">
        {/* Label & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-3 sm:gap-4">
          <div>
            <div className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Quote size={15} className="text-white/70" />
              <span>DANIŞAN YANSIMALARI</span>
            </div>
            <h2 className="serif-font text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.15]">
              Yolculuğu birlikte yürüyenler ne hissetti?
            </h2>
          </div>
          <p className="text-white/70 text-sm sm:text-base max-w-md font-light shrink-0 leading-relaxed">
            Gizlilik prensibi gereği isimler kısaltılmıştır.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {REFLECTIONS.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/10 hover:border-white/20 transition-all bg-black/40 shadow-xl group"
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
                <p className="serif-font text-xl sm:text-2xl md:text-2xl text-white/95 leading-relaxed italic mb-8 font-serif">
                  "{item.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-white/5 flex items-ceznter justify-between">
                <div>
                  <div className="text-base sm:text-lg font-semibold text-white tracking-wide">
                    {item.author}
                  </div>
                  <div className="text-xs sm:text-sm text-white/60 font-light mt-0.5">
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
      </div>
    </section>
  );
};
