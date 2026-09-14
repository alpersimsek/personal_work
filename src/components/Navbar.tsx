import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Menu, X, ArrowUpRight } from 'lucide-react';
import { NavItem } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onOpenBooking: () => void;
}

const NAV_LINKS: NavItem[] = [
  { label: 'Hakkımda', href: '#hakkimda' },
  { label: 'Yaklaşımım', href: '#yaklasim' },
  { label: 'Programlar', href: '#programlar' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="relative z-30 px-4 sm:px-12 pt-6 sm:pt-10 w-full">
      <nav
        id="navbar-container"
        className="liquid-glass rounded-full max-w-5xl mx-auto px-6 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 shadow-xl"
      >
        {/* Left Brand & Desktop Links */}
        <div className="flex items-center gap-3">
          <a
            id="nav-brand-logo"
            href="#"
            className="flex items-center gap-3 text-white group cursor-pointer"
          >
            <div className="w-5 h-5 border border-white/40 rounded-full flex items-center justify-center group-hover:border-white transition-colors">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Shanti
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 ml-8 text-sm font-medium text-white/70">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                id={`nav-link-${link.label.toLowerCase()}`}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-5">
          <a
            id="nav-link-iletisim"
            href="#iletisim"
            onClick={(e) => handleLinkClick(e, '#iletisim')}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            İletişim
          </a>

          <ThemeToggle showLabel={true} />

          <motion.button
            id="nav-btn-booking"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenBooking}
            className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-white/90 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>Görüşme Planla</span>
          </motion.button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            id="nav-btn-mobile-booking"
            onClick={onOpenBooking}
            className="bg-white text-black rounded-full px-3.5 py-1.5 text-xs font-medium"
          >
            Görüşme
          </button>
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Menüyü aç"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-3 max-w-5xl mx-auto liquid-glass rounded-2xl p-6 bg-[#0c0c0c]/95 border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col space-y-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-white/80 hover:text-white text-base font-medium py-2 border-b border-white/5 transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight size={16} className="text-white/40" />
                </a>
              ))}
              <a
                href="#iletisim"
                onClick={(e) => handleLinkClick(e, '#iletisim')}
                className="text-white/80 hover:text-white text-base font-medium py-2 border-b border-white/5 transition-colors flex items-center justify-between"
              >
                <span>İletişim</span>
                <ArrowUpRight size={16} className="text-white/40" />
              </a>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-white/80 text-base font-medium">Görünüm Teması</span>
                <ThemeToggle showLabel={true} />
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full liquid-glass bg-white text-black font-medium py-3 rounded-full text-sm mt-2 text-center"
              >
                Görüşme Planla
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

