import React, { useEffect, useRef, useState } from 'react';
import { useMotionAllowed } from '../utils/useMotionAllowed';

interface LazyVideoProps {
  src: string;
  className?: string;
  /** How far before the video scrolls into view it starts loading. */
  rootMargin?: string;
}

/**
 * A silent looping background video that only downloads once it is about to
 * be seen, and pauses again when it leaves the screen.
 *
 * Without this every video on a long page starts downloading at once, which
 * is tens of megabytes before the visitor has scrolled anywhere.
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({ src, className, rootMargin = '300px' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const motionAllowed = useMotionAllowed();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !motionAllowed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
        // Only a video that has been loaded can be paused or resumed.
        if (video.currentSrc || video.src) {
          if (entry.isIntersecting) void video.play().catch(() => {});
          else video.pause();
        }
      },
      { rootMargin },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [rootMargin, motionAllowed]);

  // Reduced motion or data saver: no download at all, the section's own background shows.
  if (!motionAllowed) return <div aria-hidden="true" className={className} />;

  return (
    <video
      ref={videoRef}
      src={near ? src : undefined}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      className={className}
    />
  );
};
