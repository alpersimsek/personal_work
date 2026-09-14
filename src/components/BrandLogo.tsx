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
      id="brand-logo-tugba-erguner"
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
            {/* Subtle luminous metallic gradient */}
            <linearGradient id="te-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#D4D4D8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#A1A1AA" stopOpacity="0.5" />
            </linearGradient>

            <linearGradient id="te-ring-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#A1A1AA" stopOpacity="0.3" />
              <stop offset="80%" stopColor="#52525B" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
            </linearGradient>

            <radialGradient id="te-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Glow on Hover */}
          <circle cx="24" cy="24" r="22" fill="url(#te-glow)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Outer Harmonious Zen Ring with elegant subtle gap for openness */}
          <circle
            cx="24"
            cy="24"
            r="21"
            stroke="url(#te-ring-grad)"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray="115 15"
            className="transition-all duration-700 group-hover:rotate-45 origin-center"
          />

          {/* Inner Minimal Monogram: T + E architectural synthesis */}
          {/* Top crossbar for T (and top bar of E) */}
          <line
            x1="15"
            y1="16"
            x2="33"
            y2="16"
            stroke="url(#te-grad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Vertical central stem for T */}
          <line
            x1="24"
            y1="16"
            x2="24"
            y2="34"
            stroke="url(#te-grad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Middle bar for E with refined harmony */}
          <line
            x1="24"
            y1="25"
            x2="31"
            y2="25"
            stroke="url(#te-grad)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />

          {/* Baseline bar for E */}
          <line
            x1="24"
            y1="34"
            x2="33"
            y2="34"
            stroke="url(#te-grad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Subtle balanced mindful focal dot on the left symbolizing self-awareness */}
          <circle
            cx="17"
            cy="25"
            r="1.5"
            fill="#FFFFFF"
            className="opacity-60 group-hover:opacity-100 transition-opacity"
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
          Tuğba Ergüner
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
