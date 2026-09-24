import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { NavItem } from '../types';
import { MenuToggleIcon, NavMenuPanel, useMenuDismiss } from './NavMenu';

interface CollapsedNavMenuProps {
  visible: boolean;
  links: NavItem[];
  panelClassName: string;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  onLogoClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onBook: () => void;
}

/** Top-left hamburger that replaces the wide navbar once the page scrolls. */
export const CollapsedNavMenu: React.FC<CollapsedNavMenuProps> = ({
  visible,
  links,
  panelClassName,
  onNavigate,
  onLogoClick,
  onBook,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!visible) close();
  }, [visible, close]);

  useMenuDismiss(open, containerRef, triggerRef, close);

  return (
    <div
      ref={containerRef}
      className={`hidden lg:block absolute top-6 left-6 transition-[opacity,visibility] duration-300 ${
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
        <MenuToggleIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <NavMenuPanel
            id="collapsed-nav-panel"
            links={links}
            className="absolute top-full left-0 mt-3 w-[23rem]"
            themeClassName={panelClassName}
            showLogo={true}
            onNavigate={onNavigate}
            onLogoClick={onLogoClick}
            onBook={onBook}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
