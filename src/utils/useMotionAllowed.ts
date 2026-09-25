import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

interface NetworkInformation {
  saveData?: boolean;
}

/**
 * Whether background video may play.
 *
 * It stays off for visitors who asked their system for less motion and for
 * those on a data-saver connection: the video is decoration, and it is the
 * heaviest thing on the page.
 */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(() => {
    const saveData = (navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData;
    return !window.matchMedia(REDUCED_MOTION_QUERY).matches && !saveData;
  });

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setAllowed(!query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return allowed;
}
