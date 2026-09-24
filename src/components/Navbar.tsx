import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavItem } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { CollapsedNavMenu } from './CollapsedNavMenu';
import { MenuToggleIcon, NavMenuPanel, useMenuDismiss } from './NavMenu';
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

const COLLAPSE_SCROLL_THRESHOLD = 80;

const DESKTOP_LINK_CLASS =
  'relative py-1 cursor-pointer text-white/75 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:outline-none focus-visible:after:scale-x-100';

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onNavigateHome, onNavigateBlog }) => {
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const compactMenuRef = useRef<HTMLDivElement>(null);
  const compactTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useMenuDismiss(mobileMenuOpen, compactMenuRef, compactTriggerRef, closeMobileMenu);

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
      <div ref={compactMenuRef}>
        <nav
          id="navbar-container"
          aria-label="Ana gezinme"
          className={`pointer-events-auto liquid-glass !overflow-visible rounded-full max-w-5xl mx-auto pl-4 pr-2 sm:pl-8 sm:pr-3 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 transition-all duration-300 shadow-xl relative z-50 min-w-0 ${
            scrolled ? 'lg:opacity-0 lg:-translate-y-6 lg:invisible lg:pointer-events-none' : ''
          }`}
        >
          <a
            id="nav-brand-logo"
            href="#"
            onClick={handleLogoClick}
            className="cursor-pointer flex items-center shrink transition-opacity hover:opacity-90 min-w-0 overflow-hidden"
          >
            <BrandLogo size="sm" showSubtitle={true} />
          </a>

          {/* Wide screens: full link row */}
          <div className="hidden lg:flex items-center gap-9 text-sm font-medium tracking-wide shrink-0">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                id={`nav-link-${link.label.toLowerCase()}`}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={DESKTOP_LINK_CLASS}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <a
              id="nav-link-iletisim"
              href="#iletisim"
              onClick={(e) => handleLinkClick(e, '#iletisim')}
              className={`${DESKTOP_LINK_CLASS} text-sm font-medium tracking-wide`}
            >
              İletişim
            </a>

            <ThemeToggle showLabel={true} />

            <button
              id="nav-btn-booking"
              type="button"
              onClick={onOpenBooking}
              className="btn btn-primary btn-sm text-sm"
            >
              Görüşme Planla
            </button>
          </div>

          {/* Mobile and tablet: booking shortcut plus the shared hamburger menu */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            <button
              id="nav-btn-mobile-booking"
              type="button"
              onClick={onOpenBooking}
              className="btn btn-primary btn-sm shrink-0"
            >
              Randevu Al
            </button>

            <button
              ref={compactTriggerRef}
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
              aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={mobileMenuOpen}
              aria-controls="compact-nav-panel"
              className="btn btn-secondary btn-icon btn-sm"
            >
              <MenuToggleIcon open={mobileMenuOpen} />
            </button>
          </div>
        </nav>

        <div className="lg:hidden max-w-5xl mx-auto flex justify-end">
          <AnimatePresence>
            {mobileMenuOpen && (
              <NavMenuPanel
                id="compact-nav-panel"
                links={MENU_LINKS}
                className="pointer-events-auto mt-3 w-full sm:w-[23rem]"
                themeClassName={getMobileMenuBg()}
                showLogo={false}
                onNavigate={handleLinkClick}
                onLogoClick={handleLogoClick}
                onBook={onOpenBooking}
                onClose={closeMobileMenu}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Wide screens: hamburger pinned to the top-left once the page is scrolled */}
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
