import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Document, pdfjs } from 'react-pdf';
import { IntroScreen } from './IntroScreen';
import { FlipbookViewer } from './FlipbookViewer';
import { ErrorBoundary } from './ErrorBoundary';
import { useMagazineStore } from '@/store/magazineStore';
import { MAGAZINE_CONFIG } from '@/config/magazine';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function Magazine() {
  const [showIntro, setShowIntro] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);
  const [introMinTimePassed, setIntroMinTimePassed] = useState(false);

  const { 
    pdfUrl, 
    setTotalPages, 
    setLoadingProgress,
    completeIntro,
    isIntroComplete 
  } = useMagazineStore();

  // Minimum intro duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroMinTimePassed(true);
    }, MAGAZINE_CONFIG.INTRO_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Handle PDF preload success
  const handlePreloadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setLoadingProgress(50);
    setPdfReady(true);
  }, [setTotalPages, setLoadingProgress]);

  // Handle PDF preload progress
  const handlePreloadProgress = useCallback(({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.round((loaded / total) * 50);
      setLoadingProgress(progress);
    }
  }, [setLoadingProgress]);

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
        {/* Preload PDF during intro */}
        {showIntro && (
          <div className="hidden">
            <Document
              file={pdfUrl}
              onLoadSuccess={handlePreloadSuccess}
              onLoadProgress={handlePreloadProgress}
              loading={null}
            />
          </div>
        )}

        {/* Intro Screen */}
        <AnimatePresence mode="wait">
          {showIntro && (
            <IntroScreen
              onComplete={handleIntroComplete}
              isReady={isReady}
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
