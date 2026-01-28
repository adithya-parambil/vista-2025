import { useCallback, useEffect } from 'react';
import { useMagazineStore } from '@/store/magazineStore';

export function useKeyboardNavigation() {
  const { goToNextPage, goToPrevPage, jumpToPage, totalPages, toggleFullscreen } = useMagazineStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        event.preventDefault();
        goToNextPage();
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        goToPrevPage();
        break;
        
      case 'Home':
        event.preventDefault();
        jumpToPage(1);
        break;
        
      case 'End':
        event.preventDefault();
        jumpToPage(totalPages);
        break;
        
      case 'PageDown':
        event.preventDefault();
        goToNextPage();
        break;
        
      case 'PageUp':
        event.preventDefault();
        goToPrevPage();
        break;
        
      case 'f':
      case 'F':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          toggleFullscreen();
        }
        break;
        
      case 'Escape':
        // Fullscreen exit is handled by browser
        break;
    }
  }, [goToNextPage, goToPrevPage, jumpToPage, totalPages, toggleFullscreen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
