import React, { useEffect, useState } from 'react';
import { BrandMark } from './BrandLogo';

interface PostCoverProps {
  /** The stored cover image URL; empty when the post has none. */
  src: string;
  alt: string;
  /** Sizing and shape, applied to the image and to the stand-in alike. */
  className?: string;
  /** Size of the logo mark on the stand-in. */
  markSize?: number;
  /** `admin` suits the light dashboard; `site` follows the active site theme. */
  tone?: 'site' | 'admin';
  /** The main picture of a page: load it right away and ahead of other images. */
  priority?: boolean;
}

/**
 * A post's cover image, or a quiet stand-in when there is none.
 *
 * No picture is ever chosen for the author: a post without a cover, or whose
 * image fails to load, shows the site's mark on a soft background instead.
 */
export const PostCover: React.FC<PostCoverProps> = ({ src, alt, className = '', markSize = 56, tone = 'site', priority = false }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    const surface =
      tone === 'admin'
        ? 'bg-neutral-100 text-neutral-400'
        : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] text-white/35';
    return (
      <div aria-hidden="true" className={`${className} flex items-center justify-center ${surface}`}>
        <BrandMark size={markSize} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      // Covers are stored at 1200x675; the sizes let the browser reserve space before the picture arrives.
      width={1200}
      height={675}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
