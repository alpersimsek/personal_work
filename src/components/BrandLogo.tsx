import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'inline' | 'stacked';
  isDark?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'inline',
  isDark: isDarkProp,
  onClick,
}) => {
  const { theme } = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : false;

  // Dimension definitions
  const dimensions = {
    sm: {
      emblem: 32,
      nameText: 'text-xs xs:text-sm sm:text-base',
      subText: 'text-[8px] xs:text-[8.5px]',
      gap: 'gap-2 sm:gap-3',
    },
    md: {
      emblem: 45,
      nameText: 'text-lg sm:text-xl',
      subText: 'text-[10px]',
      gap: 'gap-3.5',
    },
    lg: {
      emblem: 56,
      nameText: 'text-2xl sm:text-3xl',
      subText: 'text-xs',
      gap: 'gap-4',
    },
  }[size];

  // Dynamic colors for SVG gradients
  const strokeStart = isDark ? '#FFFFFF' : '#19382F';
  const strokeMid = isDark ? '#E4E4E7' : '#31574B';
  const strokeEnd = isDark ? '#A1A1AA' : '#69785F';
  const ringStart = isDark ? '#FFFFFF' : '#31574B';
  const ringEnd = isDark ? '#52525B' : '#91A184';
  const dotFill = isDark ? '#FFFFFF' : '#19382F';

  return (
    <div
      id="brand-logo-tugba-simsek"
      onClick={onClick}
      className={`group inline-flex ${
        variant === 'stacked' ? 'flex-col items-center text-center' : 'items-center'
      } ${dimensions.gap} ${className} ${onClick ? 'cursor-pointer' : ''} select-none min-w-0`}
    >
      {/* Emblem / Monogram Icon */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={dimensions.emblem}
          height={dimensions.emblem}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="te-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={strokeStart} stopOpacity="0.98" />
              <stop offset="45%" stopColor={strokeMid} stopOpacity="0.85" />
              <stop offset="100%" stopColor={strokeEnd} stopOpacity="0.75" />
            </linearGradient>

            <linearGradient id="te-ring-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={ringStart} stopOpacity="0.85" />
              <stop offset="40%" stopColor={strokeMid} stopOpacity="0.4" />
              <stop offset="75%" stopColor={ringEnd} stopOpacity="0.2" />
              <stop offset="100%" stopColor={ringStart} stopOpacity="0.6" />
            </linearGradient>

            <radialGradient id="te-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={strokeStart} stopOpacity="0.18" />
              <stop offset="100%" stopColor={strokeStart} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Glow on Hover */}
          <circle cx="24" cy="24" r="22" fill="url(#te-glow)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Double Luxury Frame: Outer Harmonious Precision Ring */}
          <circle
            cx="24"
            cy="24"
            r="21.5"
            stroke="url(#te-ring-grad)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray="122 10"
            className="transition-all duration-700 group-hover:rotate-45 origin-center"
          />
          <circle
            cx="24"
            cy="24"
            r="18.5"
            stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(25, 56, 47, 0.15)"}
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />

          {/* Charismatic Interlocking Monogram: T + E Synthesis */}
          {/* Top Roof Bar for T */}
          <line
            x1="13"
            y1="14.5"
            x2="35"
            y2="14.5"
            stroke="url(#te-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Left Serif accent on T top bar */}
          <line
            x1="13"
            y1="14.5"
            x2="13"
            y2="18"
            stroke="url(#te-grad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />

          {/* Main Central Vertical Spine (Shared for T & E) */}
          <line
            x1="21"
            y1="14.5"
            x2="21"
            y2="33.5"
            stroke="url(#te-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Middle Wing for E */}
          <line
            x1="21"
            y1="24"
            x2="31"
            y2="24"
            stroke="url(#te-grad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Bottom Base for E */}
          <line
            x1="21"
            y1="33.5"
            x2="34"
            y2="33.5"
            stroke="url(#te-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Upward Right Serif accent on E bottom base */}
          <line
            x1="34"
            y1="33.5"
            x2="34"
            y2="30"
            stroke="url(#te-grad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />

          {/* Luminous Mindful Focal Accent Dot beneath TE monogram */}
          <circle
            cx="21"
            cy="37.5"
            r="1.3"
            fill={dotFill}
            className="opacity-85 group-hover:opacity-100 transition-opacity"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className={`flex flex-col ${variant === 'stacked' ? 'items-center' : 'items-start'} leading-tight min-w-0`}>
        <span
          className={`serif-font font-medium tracking-tight transition-colors duration-300 truncate ${
            isDark ? 'text-white group-hover:text-white/90' : 'text-neutral-900 group-hover:text-neutral-800'
          } ${dimensions.nameText}`}
        >
          Tuğba Ergüner Şimşek
        </span>

        {showSubtitle && (
          <span
            className={`font-sans tracking-[0.2em] uppercase font-medium mt-0.5 transition-colors duration-300 hidden xs:block truncate ${
              isDark ? 'text-white/50 group-hover:text-white/70' : 'text-neutral-500'
            } ${dimensions.subText}`}
          >
            Yaşam Koçluğu
          </span>
        )}
      </div>
    </div>
  );
};

