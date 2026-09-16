import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'inline' | 'stacked';
  isDark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'inline',
  isDark = true,
}) => {
  // Dimension definitions
  const dimensions = {
    sm: {
      emblem: 28,
      nameText: 'text-base sm:text-lg',
      subText: 'text-[9px]',
      gap: 'gap-2.5',
    },
    md: {
      emblem: 36,
      nameText: 'text-lg sm:text-xl',
      subText: 'text-[10px]',
      gap: 'gap-3',
    },
    lg: {
      emblem: 48,
      nameText: 'text-2xl sm:text-3xl',
      subText: 'text-xs',
      gap: 'gap-4',
    },
  }[size];

  return (
    <div
      id="brand-logo-tugba-simsek"
      className={`group inline-flex ${
        variant === 'stacked' ? 'flex-col items-center text-center' : 'items-center'
      } ${dimensions.gap} ${className} select-none`}
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
            {/* Luminous platinum-gold luxury gradient */}
            <linearGradient id="te-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
              <stop offset="45%" stopColor="#E4E4E7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A1A1AA" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="te-ring-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#D4D4D8" stopOpacity="0.4" />
              <stop offset="75%" stopColor="#52525B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
            </linearGradient>

            <radialGradient id="te-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
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
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
          />

          {/* Charismatic Interlocking Monogram: T + E Synthesis */}
          {/* Top Roof Bar for T (Extends across left & right) */}
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
            fill="#FFFFFF"
            className="opacity-85 group-hover:opacity-100 transition-opacity"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className={`flex flex-col ${variant === 'stacked' ? 'items-center' : 'items-start'} leading-tight`}>
        <span
          className={`serif-font font-medium tracking-tight transition-colors duration-300 ${
            isDark ? 'text-white group-hover:text-white/90' : 'text-neutral-900 group-hover:text-neutral-800'
          } ${dimensions.nameText}`}
        >
          Tuğba Ergüner Şimşek
        </span>

        {showSubtitle && (
          <span
            className={`font-sans tracking-[0.28em] uppercase font-medium mt-0.5 transition-colors duration-300 ${
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
