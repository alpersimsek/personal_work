const SETTLE_MS = 120;
const MAX_CORRECTIONS = 3;
const TOLERANCE_PX = 2;
const DESKTOP_QUERY = '(min-width: 1024px)';
const NAVBAR_BREATHING_ROOM_PX = 16;
const CANCEL_EVENTS = ['wheel', 'touchstart', 'keydown'] as const;

/**
 * Space taken by the fixed navbar pill.
 *
 * On wide screens the pill collapses into a small corner button once the page
 * scrolls, so sections can sit flush with the top of the window.
 */
function headerOffset(): number {
  const navbar = document.getElementById('navbar-container');
  if (!navbar || window.matchMedia(DESKTOP_QUERY).matches) return 0;
  return Math.max(0, navbar.getBoundingClientRect().bottom - NAVBAR_BREATHING_ROOM_PX);
}

/**
 * Smooth-scrolls a section to the top of the window and keeps it there.
 *
 * A single smooth scroll measures the target once, so content above it that
 * changes height while scrolling (images, videos, animations) leaves the
 * section stopped short with part of the previous one still in view. Once the
 * scroll settles this re-measures and nudges the section into place. Any
 * wheel, touch or key input cancels it so it never fights the visitor.
 *
 * `instant` jumps without animating, for arriving from another page while it
 * is still fading in.
 */
export function scrollToSection(target: Element, options: { instant?: boolean } = {}): void {
  const scrollToTarget = () =>
    window.scrollTo({
      top: window.scrollY + target.getBoundingClientRect().top - headerOffset(),
      behavior: options.instant ? 'instant' : 'smooth',
    });

  let cancelled = false;
  let correctionsLeft = MAX_CORRECTIONS;
  let lastScrollY = window.scrollY;
  let lastMovement = performance.now();

  const cancel = () => {
    cancelled = true;
    CANCEL_EVENTS.forEach((type) => window.removeEventListener(type, cancel));
  };
  CANCEL_EVENTS.forEach((type) => window.addEventListener(type, cancel, { passive: true }));

  const watch = (now: number) => {
    if (cancelled) return;

    if (window.scrollY !== lastScrollY) {
      lastScrollY = window.scrollY;
      lastMovement = now;
    } else if (now - lastMovement >= SETTLE_MS) {
      const drift = target.getBoundingClientRect().top - headerOffset();
      if (Math.abs(drift) <= TOLERANCE_PX || correctionsLeft === 0) {
        cancel();
        return;
      }
      correctionsLeft -= 1;
      scrollToTarget();
      lastMovement = now;
    }
    requestAnimationFrame(watch);
  };

  scrollToTarget();
  requestAnimationFrame(watch);
}
