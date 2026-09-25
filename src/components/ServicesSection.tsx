import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight, Compass } from 'lucide-react';
import { LazyVideo } from './LazyVideo';
import { PROGRAMS, PROGRAMS_HEADING } from '../../server/content/programs';
import { followInPage } from '../utils/followInPage';
import { navigateToPath } from '../routes';

interface ServicesSectionProps {
  onSelectTopic: (topic: 'netlik' | 'donusum' | 'diger') => void;
}

const VIDEOS = {
  netlik:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
  donusum:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4',
  diger:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4',
} as const;

const CARDS_DATA = PROGRAMS.map((program) => ({
  id: program.topic,
  slug: program.slug,
  video: VIDEOS[program.topic],
  tag: program.tag,
  title: program.title,
  description: program.description,
}));

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
          className="flex flex-col items-center text-center mb-8 md:mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
              <Compass size={20} />
            </div>
            <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
              KOÇLUK ALANLARI
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.15] max-w-2xl font-serif">
            {PROGRAMS_HEADING}
          </h2>
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
              <div className="aspect-video md:aspect-auto md:h-[clamp(7rem,18svh,11rem)] overflow-hidden relative bg-black/60">
                <LazyVideo src={card.video} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Body */}
              <div className="p-6 md:p-5 lg:p-6 flex-1 flex flex-col justify-between bg-black/30">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-3">
                    <span className="text-white/80 text-xs sm:text-sm uppercase tracking-widest font-semibold px-3.5 py-1 rounded-full bg-white/5 border border-white/15">
                      {card.tag}
                    </span>
                    <div className="liquid-glass rounded-full p-2 text-white border border-white/20 group-hover:bg-white group-hover:text-black transition-colors">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                  <h3 className="text-white text-2xl sm:text-3xl md:text-2xl lg:text-[1.65rem] mb-3 md:mb-2 tracking-tight font-serif">
                    {card.title}
                  </h3>
                  <p className="text-white/80 text-base sm:text-lg md:text-sm lg:text-base leading-relaxed md:leading-normal font-light">
                    {card.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 md:pt-4 md:mt-4 border-t border-white/5 flex items-center justify-between gap-3 text-xs sm:text-sm text-white/60 group-hover:text-white/90 transition-colors font-medium">
                  <span>
                    Bu alanda görüşme başlat
                    <span className="ml-2 font-serif">→</span>
                  </span>
                  <a
                    href={`/programlar/${card.slug}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      followInPage(() => navigateToPath(`/programlar/${card.slug}`))(event);
                    }}
                    className="underline underline-offset-4 decoration-white/25 hover:decoration-current"
                  >
                    Ayrıntılar
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
