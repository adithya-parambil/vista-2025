import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { IntroScreen } from './IntroScreen';
import { FlipbookViewer } from './FlipbookViewer';
import { ErrorBoundary } from './ErrorBoundary';
import { useMagazineStore } from '@/store/magazineStore';
import { usePdfCache } from '@/hooks/usePdfCache';
import { MAGAZINE_CONFIG } from '@/config/magazine';

export function Magazine() {
  const [showIntro, setShowIntro] = useState(true);
  const [introMinTimePassed, setIntroMinTimePassed] = useState(false);

  const { 
    completeIntro,
    isIntroComplete 
  } = useMagazineStore();

  // Download and cache the PDF
  const { cachedUrl, isDownloading, downloadProgress, error: cacheError } = usePdfCache();
  
  // PDF is ready when cached
  const pdfReady = !!cachedUrl;

  // Minimum intro duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroMinTimePassed(true);
    }, MAGAZINE_CONFIG.INTRO_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Complete intro sequence
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    completeIntro();
  }, [completeIntro]);

  const isReady = pdfReady && introMinTimePassed;

  // Skip intro if already completed in this session
  useEffect(() => {
    if (isIntroComplete) {
      setShowIntro(false);
    }
  }, [isIntroComplete]);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-background">
        {/* Intro Screen */}
        <AnimatePresence mode="wait">
          {showIntro && (
            <IntroScreen
              onComplete={handleIntroComplete}
              isReady={isReady}
              downloadProgress={downloadProgress}
              isDownloading={isDownloading}
            />
          )}
        </AnimatePresence>

        {/* Main Flipbook */}
        {!showIntro && (
          <FlipbookViewer />
        )}
      </div>
    </ErrorBoundary>
  );
}
