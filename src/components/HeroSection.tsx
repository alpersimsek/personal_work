import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Instagram, Linkedin, Mail } from 'lucide-react';
import { Navbar } from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { scrollToSection } from '../utils/scrollToSection';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onNavigateHome?: (sectionHref?: string) => void;
  onNavigateBlog?: () => void;
}

const LIGHT_HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4';

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenBooking, onNavigateHome, onNavigateBlog }) => {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFadingOutRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  const animateVideoOpacity = (
    targetOpacity: number,
    durationMs: number = 500,
    onComplete?: () => void
  ) => {
    const video = videoRef.current;
    if (!video) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startOpacity = parseFloat(video.style.opacity || '0');
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Smooth linear or ease interpolation
      const current = startOpacity + (targetOpacity - startOpacity) * progress;
      if (video) {
        video.style.opacity = current.toString();
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        if (onComplete) onComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start with opacity 0
    video.style.opacity = '0';

    const handleCanPlay = () => {
      video.play().catch(() => { });
      isFadingOutRef.current = false;
      animateVideoOpacity(1, 500);
    };

    const handleTimeUpdate = () => {
      if (!video.duration || isNaN(video.duration)) return;
      const remainingTime = video.duration - video.currentTime;

      if (remainingTime <= 0.55 && !isFadingOutRef.current) {
        isFadingOutRef.current = true;
        animateVideoOpacity(0, 500);
      }
    };

    const handleEnded = () => {
      if (video) {
        video.style.opacity = '0';
      }
      setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        video.play().then(() => {
          isFadingOutRef.current = false;
          animateVideoOpacity(1, 500);
        }).catch(() => { });
      }, 100);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // If already ready
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [theme]);

  const scrollToApproach = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector('#yaklasim');
    if (el) {
      scrollToSection(el);
    }
  };

  return (
    <section className="min-h-screen relative overflow-hidden flex flex-col justify-between bg-black select-none transition-colors duration-500">
      {/* Background Video Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <video
          key={theme}
          ref={videoRef}
          src={LIGHT_HERO_VIDEO_URL}
          muted
          autoPlay
          playsInline
          loop
          preload="auto"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0 }}
        />
        {/* Theme-specific Overlays */}
        {theme === 'kiremit' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#fffaf0]/80 via-[#f7ecd7]/50 to-[#fffaf0]/90 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,_rgba(199,126,102,0.22),_transparent_38%)] pointer-events-none" />
          </>
        ) : theme === 'lacivert' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/80 via-[#f8f5ef]/50 to-[#fffdf9]/90 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,_rgba(223,150,112,0.22),_transparent_38%),radial-gradient(circle_at_85%_80%,_rgba(196,154,58,0.15),_transparent_35%)] pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#fdfaf5]/80 via-[#f7f1e8]/50 to-[#fdfaf5]/90 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(253,250,245,0.65)_85%)] pointer-events-none" />
          </>
        )}
      </div>

      {/* Atmospheric Background Glow Spots */}
      <div className="glow-spot -top-48 -left-48" />
      <div className="glow-spot -bottom-48 -right-48" />

      {/* Hero Center Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 pt-28 sm:pt-36 pb-12 sm:pb-16 text-center w-full max-w-6xl mx-auto">
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="serif-font text-5xl sm:text-7xl md:text-8xl lg:text-[100px] text-white tracking-tight leading-[0.95] sm:leading-[0.9] mb-6 sm:mb-8"
        >
          Kendine yeniden
          <br />
          <span className="italic text-white/80">yaklaş.</span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/95 text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-5xl lg:max-w-6xl leading-relaxed mb-8 sm:mb-12 font-light px-2 tracking-tight"
        >
          Hayatındaki gürültüyü biraz azaltıp ne istediğini gerçekten duymaya başladığında, değişim çok daha doğal bir yerden başlar.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-md px-2"
        >
          {/* Primary Consultation Pill */}
          <button
            id="hero-primary-cta"
            type="button"
            onClick={onOpenBooking}
            className="btn btn-primary btn-lg shrink-0"
          >
            <span className="whitespace-nowrap">İlk görüşmeni planla</span>
            <ArrowRight size={18} className="btn-arrow" />
          </button>

          {/* Secondary CTA */}
          <a
            id="hero-secondary-cta"
            href="#yaklasim"
            onClick={scrollToApproach}
            className="btn btn-ghost"
          >
            <span>Nasıl çalışıyorum?</span>
            <svg
              className="btn-arrow-down"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </a>
        </motion.div>
      </div>

      {/* Social Icons Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 px-12 pb-12 flex justify-center items-center gap-4"
      >
        <a
          id="social-link-instagram"
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-icon"
          aria-label="Instagram"
        >
          <Instagram size={20} />
        </a>
        <a
          id="social-link-linkedin"
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-icon"
          aria-label="LinkedIn"
        >
          <Linkedin size={20} />
        </a>
        <a
          id="social-link-email"
          href="mailto:iletisim@tugbaergunersimsek.com"
          className="btn btn-secondary btn-icon"
          aria-label="E-posta Gönder"
        >
          <Mail size={20} />
        </a>
      </motion.div>

      {/* Background texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-20" />
    </section>
  );
};
