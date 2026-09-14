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
      className="bg-black pt-4 md:pt-6 pb-12 md:pb-16 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden min-h-[440px] sm:min-h-0 sm:aspect-[16/10] md:aspect-video border border-white/10 shadow-2xl group flex flex-col justify-end"
        >
          {/* Background Atmospheric Video */}
          <video
            src={FEATURED_VIDEO_URL}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-102 transition-transform duration-1000"
          />

          {/* Gradients to protect card and text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 pointer-events-none" />

          {/* Video Overlay Content */}
          <div className="relative p-4 sm:p-8 md:p-10 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 sm:gap-6 z-10 w-full">
            {/* Left Glass Card */}
            <div className="liquid-glass rounded-2xl p-4 sm:p-6 md:p-8 w-full md:max-w-lg bg-black/40 border border-white/15 backdrop-blur-md">
              <div className="text-white/60 text-[11px] sm:text-xs tracking-widest uppercase mb-1.5 sm:mb-2.5 font-medium">
                YAKLAŞIMIM
              </div>
              <p className="text-white text-xs sm:text-sm md:text-base leading-relaxed font-light">
                Koçluk sana ne yapman gerektiğini söylemek değildir. Doğru sorularla kendi cevaplarını daha net görmeni, seni tekrar eden döngüleri fark etmeni ve sana gerçekten ait olan yönü bulmanı sağlar.
              </p>
            </div>

            {/* Right CTA */}
            <motion.a
              id="featured-approach-cta"
              href="#farkindalik-eylem"
              onClick={scrollToPhilosophy}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="liquid-glass rounded-full px-6 py-3 sm:px-7 sm:py-3.5 text-white text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start gap-2 hover:bg-white/10 transition-colors border border-white/25 cursor-pointer shrink-0 shadow-lg w-full sm:w-auto"
            >
              <span>Yaklaşımımı keşfet</span>
              <ArrowUpRight size={16} />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};





