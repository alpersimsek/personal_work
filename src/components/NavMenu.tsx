import React, { RefObject, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { NavItem } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const ACTIVE_LINE_RATIO = 0.35;
const LINE_TRANSITION = 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]';

/** Returns the href of the section crossing the reading line, if any. */
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

/**
 * Closes an open menu on outside press or Escape.
 *
 * Escape returns focus to the trigger so keyboard users keep their place.
 */
export function useMenuDismiss(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;

    const handleOutsidePress = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onClose();
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', handleOutsidePress);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePress);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, containerRef, triggerRef, onClose]);
}

/** Two thin lines that morph into a cross while the menu is open. */
export const MenuToggleIcon: React.FC<{ open: boolean }> = ({ open }) => (
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
);

interface NavMenuPanelProps {
  id: string;
  links: NavItem[];
  /** Placement and sizing, supplied by whichever trigger owns the panel. */
  className: string;
  /** Theme colours for background, border and text. */
  themeClassName: string;
  /** Whether to repeat the brand logo at the top of the panel. */
  showLogo: boolean;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onLogoClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onBook: () => void;
  onClose: () => void;
}

/** The shared glass panel opened by both the desktop and the compact menu. */
export const NavMenuPanel: React.FC<NavMenuPanelProps> = ({
  id,
  links,
  className,
  themeClassName,
  showLogo,
  onNavigate,
  onLogoClick,
  onBook,
  onClose,
}) => {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    setActiveHref(findActiveHref(links));
  }, [links]);

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      style={{ transformOrigin: 'top left' }}
      className={`rounded-3xl p-6 shadow-2xl backdrop-blur-xl border ${themeClassName} ${className}`}
    >
      {showLogo && (
        <a
          href="#"
          onClick={(e) => {
            onClose();
            onLogoClick(e);
          }}
          aria-label="Ana sayfaya dön"
          className="mb-5 inline-flex transition-opacity hover:opacity-80"
        >
          <BrandLogo size="sm" showSubtitle={true} />
        </a>
      )}

      <nav aria-label="Ana menü" className="flex flex-col">
        {links.map((link, index) => {
          const isActive = link.href === activeHref;
          return (
            <motion.a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                onClose();
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
            onClose();
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
  );
};
