import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Leaf, Compass, Flame, ChevronDown, Check } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = true }) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { id: Theme; label: string; subLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'adacayi',
      label: 'Adaçayı',
      subLabel: 'Doğal Yeşil',
      icon: <Leaf size={14} className="text-[#31574b]" />
    },
    {
      id: 'light',
      label: 'Toprak Beji',
      subLabel: 'Sıcak Krem',
      icon: <Sun size={14} className="text-[#8A5A44]" />
    },
    {
      id: 'lacivert',
      label: 'Lacivert',
      subLabel: 'Gece Mavisi',
      icon: <Compass size={14} className="text-[#29415a]" />
    },
    {
      id: 'kiremit',
      label: 'Kiremit',
      subLabel: 'Terakota & Şampanya',
      icon: <Flame size={14} className="text-[#c77e66]" />
    }
  ];

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`relative inline-block text-left z-50 ${className}`} ref={dropdownRef}>
      <motion.button
        id="theme-toggle-btn"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-glass rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2 border transition-all cursor-pointer shadow-xs text-xs sm:text-sm font-medium"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Tema Değiştir"
      >
        <span className="flex items-center justify-center">
          {currentTheme.icon}
        </span>
        {showLabel && (
          <span className="tracking-wide">{currentTheme.label}</span>
        )}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center opacity-70 ml-0.5"
        >
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-48 sm:w-52 rounded-2xl bg-[#151a21]/95 text-white border border-white/20 shadow-2xl p-1.5 z-[9999] backdrop-blur-2xl"
          >
            <div className="text-[10px] uppercase font-semibold tracking-wider text-white/50 px-3 py-1.5">
              Tema Seçimi
            </div>
            <div className="space-y-0.5">
              {themes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white/15 text-white shadow-xs font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center bg-white/10">
                        {t.icon}
                      </div>
                      <div className="text-left leading-tight">
                        <div>{t.label}</div>
                        <div className="text-[10px] text-white/40 font-normal">{t.subLabel}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-amber-300"
                      >
                        <Check size={14} />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
