import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { NavItem } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { CollapsedNavMenu } from './CollapsedNavMenu';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenBooking: () => void;
  onNavigateHome?: (sectionHref?: string) => void;
  onNavigateBlog?: () => void;
}

const NAV_LINKS: NavItem[] = [
  { label: 'Hakkımda', href: '#hakkimda' },
  { label: 'Yaklaşımım', href: '#yaklasim' },
  { label: 'Programlar', href: '#programlar' },
  { label: 'Blog', href: '#blog' },
];

const MENU_LINKS: NavItem[] = [...NAV_LINKS, { label: 'İletişim', href: '#iletisim' }];

interface NavMenuContentProps {
  onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onBook: () => void;
}

const NavMenuContent: React.FC<NavMenuContentProps> = ({ onLinkClick, onBook }) => (
  <div className="flex flex-col space-y-3.5">
    {NAV_LINKS.map((link) => (
      <a
        key={link.label}
        href={link.href}
        onClick={(e) => onLinkClick(e, link.href)}
        className="py-2 border-b border-current/10 font-medium text-sm sm:text-base transition-colors flex items-center justify-between"
      >
        <span>{link.label}</span>
        <ArrowUpRight size={16} className="opacity-40" />
      </a>
    ))}

    <a
      href="#iletisim"
      onClick={(e) => onLinkClick(e, '#iletisim')}
      className="py-2 border-b border-current/10 font-medium text-sm sm:text-base transition-colors flex items-center justify-between"
    >
      <span>İletişim</span>
      <ArrowUpRight size={16} className="opacity-40" />
    </a>

    <div className="flex items-center justify-between py-2 border-b border-current/10">
      <span className="text-sm font-medium">Görünüm Teması</span>
      <ThemeToggle showLabel={true} />
    </div>

    <button
      onClick={onBook}
      className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm mt-2 text-center shadow-md cursor-pointer"
    >
      Görüşme Planla
    </button>
  </div>
);

const COLLAPSE_SCROLL_THRESHOLD = 80;

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onNavigateHome, onNavigateBlog }) => {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > COLLAPSE_SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (href === '#blog' && onNavigateBlog) {
      onNavigateBlog();
      return;
    }

    if (onNavigateHome) {
      onNavigateHome(href);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mobile menu background derived from theme
  const getMobileMenuBg = () => {
    switch (theme) {
      case 'adacayi':
        return 'bg-[#fdfaf5]/95 border-[#ddd5ca] text-[#26332e]';
      case 'light':
        return 'bg-[#F4EDE3]/95 border-[#D7C5B3] text-[#33261F]';
      case 'lacivert':
        return 'bg-[#fffdf9]/95 border-[#e2ddd4] text-[#172536]';
      case 'kiremit':
        return 'bg-[#fffaf0]/95 border-[#ead8b8] text-[#33261F]';
      default:
        return 'bg-[#0c0c0c]/95 border-white/10 text-white';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-2.5 sm:px-12 pt-2.5 sm:pt-6 w-full pointer-events-none transition-all duration-300">
      <nav
        id="navbar-container"
        className={`pointer-events-auto liquid-glass !overflow-visible rounded-full max-w-5xl mx-auto px-3.5 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 transition-all duration-300 shadow-xl relative z-50 min-w-0 ${
          scrolled ? 'md:opacity-0 md:-translate-y-6 md:invisible md:pointer-events-none' : ''
        }`}
      >
        {/* Left: Brand Logo & Monogram */}
        <a
          id="nav-brand-logo"
          href="#"
          onClick={handleLogoClick}
          className="cursor-pointer flex items-center shrink transition-opacity hover:opacity-90 min-w-0 overflow-hidden"
        >
          <BrandLogo size="sm" showSubtitle={true} />
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-3 lg:gap-9 text-xs sm:text-sm font-medium tracking-wide shrink-0">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              id={`nav-link-${link.label.toLowerCase()}`}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-white/75 hover:text-white transition-colors py-1 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Contact Link, Theme Selector & Booking CTA */}
        <div className="hidden md:flex items-center gap-2 lg:gap-5 shrink-0">
          <a
            id="nav-link-iletisim"
            href="#iletisim"
            onClick={(e) => handleLinkClick(e, '#iletisim')}
            className="text-xs sm:text-sm font-medium text-white/75 hover:text-white transition-colors py-1 cursor-pointer"
          >
            İletişim
          </a>

          <ThemeToggle showLabel={true} />

          <motion.button
            id="nav-btn-booking"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenBooking}
            className="bg-white text-black px-4 py-2 lg:px-6 lg:py-2.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-white/90 transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
          >
            <span className="lg:hidden">Randevu Al</span>
            <span className="hidden lg:inline">Görüşme Planla</span>
          </motion.button>
        </div>

        {/* Mobile View Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden shrink-0">
          <button
            id="nav-btn-mobile-booking"
            onClick={onOpenBooking}
            className="bg-white text-black rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs shrink-0 whitespace-nowrap"
          >
            Randevu Al
          </button>

          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Menüyü aç/kapat"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto md:hidden mt-3 max-w-5xl mx-auto rounded-2xl p-6 shadow-2xl backdrop-blur-xl border ${getMobileMenuBg()}`}
          >
            <NavMenuContent
              onLinkClick={handleLinkClick}
              onBook={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Web: hamburger menu pinned to the top-left once the page is scrolled */}
      <CollapsedNavMenu
        visible={scrolled}
        links={MENU_LINKS}
        panelClassName={getMobileMenuBg()}
        onNavigate={handleLinkClick}
        onLogoClick={handleLogoClick}
        onBook={onOpenBooking}
      />
    </header>
  );
};
