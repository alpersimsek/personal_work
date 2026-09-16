import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

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
      className="bg-black pt-12 md:pt-16 pb-16 md:pb-24 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto text-left">
        {/* Top Header & Narrative outside the video */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-white/10"
        >
          <div className="flex-1 max-w-none">
            <div className="text-white/50 text-xs sm:text-sm tracking-[0.25em] uppercase mb-3 sm:mb-4 font-semibold">
              YAKLAŞIMIM
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl text-white leading-[1.15] tracking-tight font-serif max-w-none mb-3 sm:mb-4">
              Koçluk sana ne yapman gerektiğini söylemek değildir.
            </h2>
            <p className="text-white/80 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-4xl">
              Doğru sorularla kendi cevaplarını daha net görmeni, seni tekrar eden döngüleri fark etmeni ve sana gerçekten ait olan yönü bulmanı sağlar.
            </p>
          </div>

          <motion.a
            id="featured-approach-cta"
            href="#farkindalik-eylem"
            onClick={scrollToPhilosophy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="liquid-glass rounded-full px-7 py-3.5 sm:px-9 sm:py-4 text-sm sm:text-base md:text-lg font-semibold flex items-center justify-center gap-2.5 hover:bg-white/10 transition-colors border border-white/25 cursor-pointer shrink-0 shadow-lg w-full sm:w-auto self-start md:self-end text-white"
          >
            <span>Yaklaşımımı keşfet</span>
            <ArrowUpRight size={18} />
          </motion.a>
        </motion.div>

        {/* Clean, 100% Unobstructed Cinematic Video Below */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden aspect-[16/9] border border-white/15 shadow-2xl group"
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





