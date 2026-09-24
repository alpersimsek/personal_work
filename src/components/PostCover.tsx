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
}

/**
 * A post's cover image, or a quiet stand-in when there is none.
 *
 * No picture is ever chosen for the author: a post without a cover, or whose
 * image fails to load, shows the site's mark on a soft background instead.
 */
export const PostCover: React.FC<PostCoverProps> = ({ src, alt, className = '', markSize = 56, tone = 'site' }) => {
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

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
};
