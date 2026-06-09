import { useEffect } from 'react';

// Global counter to track how many modals are asking for a scroll lock.
// This prevents one modal from un-locking the scroll if another modal is still open.
let scrollLockCount = 0;

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      scrollLockCount++;
      if (scrollLockCount === 1) {
        document.body.style.overflow = 'hidden';
      }
      return () => {
        scrollLockCount--;
        if (scrollLockCount === 0) {
          document.body.style.overflow = '';
        }
      };
    }
  }, [isLocked]);
}
