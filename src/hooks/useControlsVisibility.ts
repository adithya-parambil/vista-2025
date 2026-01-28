import { useCallback, useEffect, useRef } from 'react';
import { useMagazineStore } from '@/store/magazineStore';
import { MAGAZINE_CONFIG } from '@/config/magazine';

export function useControlsVisibility() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { controlsVisible, setControlsVisible } = useMagazineStore();

  const showControls = useCallback(() => {
    setControlsVisible(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout to hide controls
    timeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, MAGAZINE_CONFIG.CONTROLS_HIDE_DELAY);
  }, [setControlsVisible]);

  const hideControls = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setControlsVisible(false);
  }, [setControlsVisible]);

  // Show controls on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      showControls();
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    // Initial show
    showControls();

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showControls]);

  return { controlsVisible, showControls, hideControls };
}
