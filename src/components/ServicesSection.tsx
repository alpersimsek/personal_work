import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface ServicesSectionProps {
  onSelectTopic: (topic: 'netlik' | 'donusum' | 'diger') => void;
}

const CARDS_DATA = [
  {
    id: 'netlik' as const,
    video:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
    tag: 'NETLİK',
    title: 'Kendini ve Yönünü Keşfet',
    description:
      'Ne istediğini bilmediğin dönemlerde zihindeki karmaşayı sadeleştirir, değerlerini ve gerçekten önemli olanı görünür hâle getiririz.',
  },
  {
    id: 'donusum' as const,
    video:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
    tag: 'DÖNÜŞÜM',
    title: 'Düşünceden Eyleme',
    description:
      'Seni aynı yerde tutan alışkanlıkları ve tekrar eden kalıpları fark eder, sana uygun gerçekçi adımlarla sürdürülebilir değişim oluştururuz.',
  },
  {
    id: 'diger' as const,
    video:
      'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4',
    tag: 'DENGE',
    title: 'Zihinsel Denge & Mindfulness',
    description:
      'Günlük hayatın yoğun telaşı içinde kendi merkezinde kalmayı, tükenmişliği önleyip sakin ve sürdürülebilir bir içsel denge kurmayı deneyimlersin.',
  },
];

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectTopic }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  return (
    <section
      id="programlar"
      ref={ref}
      className="bg-black py-12 sm:py-16 md:py-20 px-4 sm:px-6 overflow-hidden bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_60%)] relative"
    >
      <div className="max-w-6xl mx-auto text-left">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-3 sm:gap-4"
        >
          <div className="text-center md:text-left">
            <div className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase mb-3 sm:mb-4 font-semibold">
              KOÇLUK ALANLARI
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15] max-w-2xl font-serif">
              Birlikte neyin üzerinde çalışabiliriz?
            </h2>
          </div>
        </motion.div>

        {/* Coaching Cards (3-Column Layout on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS_DATA.map((card, idx) => (
            <motion.div
              key={card.tag}
              id={`service-card-${card.id}`}
              onClick={() => onSelectTopic(card.id)}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{
                duration: 0.8,
                delay: idx * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4 }}
              className="liquid-glass rounded-3xl overflow-hidden group border border-white/10 cursor-pointer shadow-xl flex flex-col justify-between"
            >
              {/* Video Area */}
              <div className="aspect-video overflow-hidden relative bg-black/60">
                <video
                  src={card.video}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-black/30">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80 text-xs sm:text-sm uppercase tracking-widest font-semibold px-3.5 py-1 rounded-full bg-white/5 border border-white/15">
                      {card.tag}
                    </span>
                    <div className="liquid-glass rounded-full p-2 text-white border border-white/20 group-hover:bg-white group-hover:text-black transition-colors">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                  <h3 className="text-white text-2xl sm:text-3xl mb-3 tracking-tight font-serif">
                    {card.title}
                  </h3>
                  <p className="text-white/80 text-base sm:text-lg leading-relaxed font-light">
                    {card.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center text-xs sm:text-sm text-white/60 group-hover:text-white/90 transition-colors font-medium">
                  <span>Bu alanda görüşme başlat</span>
                  <span className="ml-2 font-serif">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
