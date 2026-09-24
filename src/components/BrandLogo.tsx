import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'inline' | 'stacked';
  isDark?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const SIZES = {
  sm: {
    emblem: 32,
    nameText: 'text-[15px] xs:text-[17px] sm:text-xl',
    subText: 'text-[8px]',
    gap: 'gap-2.5',
  },
  md: {
    emblem: 44,
    nameText: 'text-2xl',
    subText: 'text-[9px]',
    gap: 'gap-3.5',
  },
  lg: {
    emblem: 56,
    nameText: 'text-3xl sm:text-4xl',
    subText: 'text-[10px]',
    gap: 'gap-4',
  },
} as const;

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

/** Each ray's path and the delay before it appears, after the sun has risen. */
const RAYS = [
  { path: 'M24 19 L24 15.5', delay: '0.4s' },
  { path: 'M31.64 21.48 L33.7 18.67', delay: '0.48s' },
  { path: 'M16.36 21.48 L14.3 18.67', delay: '0.48s' },
  { path: 'M36.36 27.98 L39.69 26.9', delay: '0.56s' },
  { path: 'M11.64 27.98 L8.31 26.9', delay: '0.56s' },
] as const;

/**
 * The brand mark: a horizon with its reflection, waiting for the sun.
 *
 * On a desktop pointer only the horizon shows at rest; on hover the sun rises
 * and its rays open one after another. Phones and touch screens have no hover,
 * so below the md breakpoint (and on any touch device) the risen sun and its
 * rays are always shown: the site's "new beginning".
 */
const Emblem: React.FC<{ size: number }> = ({ size }) => {
  const clipId = useId();
  const stroke = { stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' as const };

  return (
    <svg width={size} height={(size * 32) / 40} viewBox="4 12 40 32" overflow="visible" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="48" height="32" />
        </clipPath>
      </defs>

      <path {...stroke} strokeWidth="1.75" d="M6 32 H42" />
      <g
        style={{ transformOrigin: '24px 36.5px' }}
        className={`scale-x-[0.8] max-md:scale-x-100 [@media(hover:none)]:scale-x-100 group-hover:scale-x-100 transition-transform duration-[900ms] ${EASE} motion-reduce:transition-none`}
      >
        <path {...stroke} strokeWidth="1.5" opacity="0.5" d="M14 36.5 H34" />
      </g>
      <g
        style={{ transformOrigin: '24px 40.5px' }}
        className={`scale-x-[0.7] max-md:scale-x-100 [@media(hover:none)]:scale-x-100 group-hover:scale-x-100 transition-transform duration-[900ms] ${EASE} motion-reduce:transition-none`}
      >
        <path {...stroke} strokeWidth="1.5" opacity="0.3" d="M18 40.5 H30" />
      </g>

      <g clipPath={`url(#${clipId})`}>
        <g className={`translate-y-[10px] max-md:translate-y-0 [@media(hover:none)]:translate-y-0 group-hover:translate-y-0 transition-transform duration-[900ms] ${EASE} motion-reduce:transition-none`}>
          <circle {...stroke} strokeWidth="1.75" cx="24" cy="32" r="9" />
          <circle {...stroke} strokeWidth="1.5" opacity="0.5" cx="24" cy="32" r="4.6" />
        </g>
      </g>

      {RAYS.map(({ path, delay }) => (
        <path
          key={path}
          {...stroke}
          strokeWidth="1.75"
          d={path}
          style={{ transformOrigin: '24px 32px', transitionDelay: delay }}
          className={`opacity-0 scale-[0.82] max-md:opacity-100 max-md:scale-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:scale-100 group-hover:opacity-100 group-hover:scale-[1.08] transition-[opacity,scale] duration-700 ${EASE} motion-reduce:transition-none`}
        />
      ))}
    </svg>
  );
};

/** The site logo: the emblem beside the coach's name in a serif wordmark. */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'inline',
  isDark = false,
  onClick,
}) => {
  const dimensions = SIZES[size];
  const stacked = variant === 'stacked';

  return (
    <div
      id="brand-logo-tugba-simsek"
      onClick={onClick}
      style={{ color: isDark ? '#ffffff' : 'var(--btn-ink)' }}
      className={`group inline-flex ${
        stacked ? 'flex-col items-center text-center' : 'items-center'
      } ${dimensions.gap} ${className} ${onClick ? 'cursor-pointer' : ''} select-none min-w-0`}
    >
      <Emblem size={dimensions.emblem} />

      <div className={`flex flex-col ${stacked ? 'items-center' : 'items-start'} min-w-0`}>
        <span className={`serif-font leading-[1.3] tracking-[0.005em] truncate ${dimensions.nameText}`}>
          Tuğba Ergüner Şimşek
        </span>

        {showSubtitle && (
          <span
            className={`font-sans font-medium uppercase tracking-[0.28em] mt-0.5 opacity-60 hidden xs:block truncate ${dimensions.subText}`}
          >
            Yaşam Koçluğu
          </span>
        )}
      </div>
    </div>
  );
};
