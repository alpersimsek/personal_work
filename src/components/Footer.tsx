import React from 'react';
import { Sparkles, Instagram, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBooking }) => {
  const handleScrollTo = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black text-white border-t border-white/10 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {/* Top footer row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-white/5">
          {/* Brand & Subtext */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 border border-white/40 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="serif-font text-2xl tracking-tight text-white font-semibold">
                Shanti
              </span>
            </div>
            <p className="text-white/50 text-xs sm:text-sm font-light">
              Kendine daha yakın bir yaşam için.
            </p>
          </div>

          {/* Navigation Links & Socials */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-sm text-white/60">
            <a
              href="#hakkimda"
              onClick={(e) => handleScrollTo(e, '#hakkimda')}
              className="hover:text-white transition-colors"
            >
              Hakkımda
            </a>
            <a
              href="#yaklasim"
              onClick={(e) => handleScrollTo(e, '#yaklasim')}
              className="hover:text-white transition-colors"
            >
              Yaklaşımım
            </a>
            <a
              href="#programlar"
              onClick={(e) => handleScrollTo(e, '#programlar')}
              className="hover:text-white transition-colors"
            >
              Programlar
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Instagram</span>
            </a>
            <a
              href="#iletisim"
              onClick={(e) => handleScrollTo(e, '#iletisim')}
              className="hover:text-white transition-colors"
            >
              İletişim
            </a>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <p className="text-white/40">
            © 2026 Shanti. Tüm hakları saklıdır.
          </p>

          {/* Subtle Disclaimer */}
          <p className="text-white/25 text-[11px] sm:text-xs max-w-xl text-left md:text-right font-light">
            Yaşam koçluğu; psikoterapi, psikolojik danışmanlık veya tıbbi tedavinin yerine geçmez.
          </p>
        </div>
      </div>
    </footer>
  );
};
