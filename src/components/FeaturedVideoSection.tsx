import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowDown, Focus } from 'lucide-react';

interface FeaturedVideoSectionProps {
  onOpenBooking: () => void;
}

const FEATURED_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4';

export const FeaturedVideoSection: React.FC<FeaturedVideoSectionProps> = ({ onOpenBooking }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
  });

  const scrollToPhilosophy = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector('#farkindalik-eylem');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="yaklasim"
      ref={ref}
      className="bg-black py-8 md:py-10 px-4 sm:px-6 overflow-hidden scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto text-left">
        {/* Top Header & Narrative outside the video */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 md:mb-10 flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
              <Focus size={20} />
            </div>
            <span className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
              YAKLAŞIMIM
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl text-white leading-[1.15] tracking-tight font-serif max-w-none mb-3 sm:mb-4">
            Koçluk sana ne yapman gerektiğini söylemek değildir.
          </h2>
          <p className="text-white/80 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-4xl">
            Doğru sorularla kendi cevaplarını daha net görmeni, seni tekrar eden döngüleri fark etmeni ve sana gerçekten ait olan yönü bulmanı sağlar.
          </p>

          <a
            id="featured-approach-cta"
            href="#farkindalik-eylem"
            onClick={scrollToPhilosophy}
            className="btn btn-secondary mt-5 md:mt-0 md:absolute md:right-0 md:top-1 shrink-0"
          >
            <span>Yaklaşımımı keşfet</span>
            <ArrowDown size={14} className="btn-arrow-down" />
          </a>
        </motion.div>

        {/* Clean, 100% Unobstructed Cinematic Video Below */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full mx-auto rounded-3xl overflow-hidden aspect-[16/9] max-h-[calc(100svh-25rem)] min-h-[16rem] border border-white/15 shadow-2xl group"
        >
          {/* Background Atmospheric Video */}
          <video
            src={FEATURED_VIDEO_URL}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover scale-100 group-hover:scale-102 transition-transform duration-1000"
          />
        </motion.div>
      </div>
    </section>
  );
};





