import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { NavItem } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

interface CollapsedNavMenuProps {
  visible: boolean;
  links: NavItem[];
  panelClassName: string;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onLogoClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onBook: () => void;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const ACTIVE_LINE_RATIO = 0.35;
const LINE_TRANSITION = 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]';

function findActiveHref(links: NavItem[]): string | null {
  const readingLine = window.innerHeight * ACTIVE_LINE_RATIO;
  const active = links.find(({ href }) => {
    const section = document.querySelector(href);
    if (!section) return false;
    const { top, bottom } = section.getBoundingClientRect();
    return top <= readingLine && bottom > readingLine;
  });
  return active?.href ?? null;
}

export const CollapsedNavMenu: React.FC<CollapsedNavMenuProps> = ({
  visible,
  links,
  panelClassName,
  onNavigate,
  onLogoClick,
  onBook,
}) => {
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!open) return;
    setActiveHref(findActiveHref(links));

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, links]);

  return (
    <div
      ref={containerRef}
      className={`hidden md:block absolute top-6 left-6 transition-[opacity,visibility] duration-300 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
      }`}
    >
      <button
        ref={triggerRef}
        id="btn-collapsed-menu-toggle"
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={open}
        aria-controls="collapsed-nav-panel"
        className="liquid-glass rounded-full w-12 h-12 flex items-center justify-center text-white/90 hover:text-white shadow-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        <span aria-hidden="true" className="relative block w-[18px] h-[10px]">
          <span
            className={`absolute left-0 block h-[1.5px] w-full rounded-full bg-current ${LINE_TRANSITION} ${
              open ? 'top-[4.25px] rotate-45' : 'top-0'
            }`}
          />
          <span
            className={`absolute left-0 block h-[1.5px] rounded-full bg-current ${LINE_TRANSITION} ${
              open ? 'top-[4.25px] w-full -rotate-45' : 'top-[8.5px] w-[60%]'
            }`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="collapsed-nav-panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            style={{ transformOrigin: 'top left' }}
            className={`absolute top-full left-0 mt-3 w-[23rem] rounded-3xl p-6 shadow-2xl backdrop-blur-xl border ${panelClassName}`}
          >
            <a
              href="#"
              onClick={(e) => {
                setOpen(false);
                onLogoClick(e);
              }}
              aria-label="Ana sayfaya dön"
              className="inline-flex transition-opacity hover:opacity-80"
            >
              <BrandLogo size="sm" showSubtitle={true} />
            </a>

            <nav aria-label="Ana menü" className="mt-5 flex flex-col">
              {links.map((link, index) => {
                const isActive = link.href === activeHref;
                return (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      setOpen(false);
                      onNavigate(e, link.href);
                    }}
                    aria-current={isActive ? 'location' : undefined}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + index * 0.04, duration: 0.45, ease: EASE_OUT }}
                    className="group flex items-center gap-3 py-1.5 font-serif text-2xl tracking-tight cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-transform duration-300 ${
                        isActive ? 'scale-100' : 'scale-0 group-hover:scale-100'
                      }`}
                    />
                    <span
                      className={`transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 ${
                        isActive ? 'opacity-100' : 'opacity-75 group-hover:opacity-100'
                      }`}
                    >
                      {link.label}
                    </span>
                  </motion.a>
                );
              })}
            </nav>

            <div className="mt-5 pt-5 border-t border-current/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onBook();
                }}
                className="bg-white text-black font-semibold rounded-full px-5 py-2.5 text-sm flex items-center gap-2 shadow-md hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Görüşme Planla</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
              <ThemeToggle showLabel={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
