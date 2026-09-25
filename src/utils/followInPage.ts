import type React from 'react';

/**
 * Click handler for a real link that the app opens without reloading.
 *
 * Plain left-clicks run `open`; anything else (middle-click, Ctrl/Cmd/Shift
 * or Alt-click) is left to the browser, so "open in new tab" keeps working.
 */
export function followInPage(open: () => void) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    open();
  };
}
