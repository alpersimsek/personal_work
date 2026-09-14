import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.button
      id="theme-toggle-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`liquid-glass rounded-full p-2.5 sm:px-3 sm:py-2 flex items-center gap-2 border transition-all cursor-pointer shadow-sm ${
        isLight
          ? 'bg-[#ebdcd0]/80 border-[#8c6950]/30 text-[#3d2e24] hover:bg-[#e4d3c5]'
          : 'bg-white/5 border-white/20 text-white/90 hover:bg-white/10 hover:text-white'
      } ${className}`}
      title={isLight ? 'Karanlık Temaya Geç' : 'Toprak Tonları Aydınlık Temaya Geç'}
      aria-label="Tema Değiştir"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isLight ? (
            <Sun size={18} className="text-[#8c5e3c]" />
          ) : (
            <Moon size={18} className="text-amber-200/90" />
          )}
        </motion.div>
      </div>

      {showLabel && (
        <span className="text-xs font-medium tracking-wide">
          {isLight ? 'Aydınlık (Toprak)' : 'Karanlık'}
        </span>
      )}
    </motion.button>
  );
};
