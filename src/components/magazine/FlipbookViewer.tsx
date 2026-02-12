import { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagazineStore } from '@/store/magazineStore';
import { MAGAZINE_CONFIG } from '@/config/magazine';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useControlsVisibility } from '@/hooks/useControlsVisibility';
import { usePageSound } from '@/hooks/usePageSound';
import { Controls } from './Controls';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';

// Configure PDF.js worker - use local copy to avoid CORS issues
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// ---- FlipBook Page Component ----
// react-pageflip REQUIRES each child to forwardRef to a div.
interface FlipPageProps {
  pageNumber: number;
  width: number;
  height: number;
  isCover?: boolean;
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(
  ({ pageNumber, width, height, isCover = false }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const {
      cachedPdfUrl,
      pdfUrl,
      addCachedPage,
      addLoadingPage,
      removeLoadingPage,
      isMobile,
      isTablet,
      markPageRendered,
      currentPage, // Get current page for virtualization
    } = useMagazineStore();

    const effectivePdfUrl = cachedPdfUrl || pdfUrl;

    const getScale = useCallback(() => {
      if (isMobile) return MAGAZINE_CONFIG.MOBILE_SCALE;
      if (isTablet) return MAGAZINE_CONFIG.TABLET_SCALE;
      return MAGAZINE_CONFIG.DESKTOP_SCALE;
    }, [isMobile, isTablet]);

    // DPI Capping: High density screens (3x/4x) cause OOM on mobile.
    // We cap the effective pixel ratio to 1.5 on mobile for stability.
    const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;

    // Virtualization: Only render pages near the current page
    // User requested ~4-7 pages ready. +/- 4 gives us a simplified range.
    const renderWindow = isMobile ? 4 : 6;
    const shouldRender = Math.abs(pageNumber - currentPage) <= renderWindow;

    // Reset loaded state if we unmount
    useEffect(() => {
      if (!shouldRender) {
        setIsLoaded(false);
      }
    }, [shouldRender]);

    useEffect(() => {
      if (!isLoaded) addLoadingPage(pageNumber);
    }, [isLoaded, pageNumber, addLoadingPage]);

    const handleLoadSuccess = useCallback(() => {
      setIsLoaded(true);
      setHasError(false);
      removeLoadingPage(pageNumber);
      addCachedPage(pageNumber);
      markPageRendered(pageNumber);
    }, [pageNumber, removeLoadingPage, addCachedPage, markPageRendered]);

    const handleLoadError = useCallback((error: Error) => {
      setHasError(true);
      removeLoadingPage(pageNumber);
    }, [pageNumber, removeLoadingPage]);

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          background: '#fff',
          overflow: 'hidden',
          boxShadow: isCover ? '2px 2px 12px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {/* Loading skeleton */}
        {!isLoaded && !hasError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
            }}
          >
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              color: '#999',
            }}
          >
            <p style={{ fontSize: '0.875rem' }}>Failed to load page {pageNumber}</p>
          </div>
        )}

        {/* PDF Page - Virtualized */}
        {shouldRender && (
          <Document
            file={effectivePdfUrl}
            loading={null}
            error={null}
            onLoadError={(error) => handleLoadError(error as Error)}
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              scale={getScale()}
              devicePixelRatio={pixelRatio} // Cap DPI to prevent OOM
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={null}
              onLoadSuccess={handleLoadSuccess}
              onRenderError={(error) => handleLoadError(error as Error)}
            />
          </Document>
        )}
      </div>
    );
  }
);

FlipPage.displayName = 'FlipPage';

// ---- FlipbookViewer ----
interface FlipbookViewerProps {
  className?: string;
}

export function FlipbookViewer({ className = '' }: FlipbookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<any>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const {
    cachedPdfUrl,
    pdfUrl,
    currentPage,
    totalPages,
    setTotalPages,
    setCurrentPage,
    setLoading,
    setLoadingProgress,
    error,
    setError,
    isLoading,
    zoomLevel,
    viewMode,
    setDeviceType,
    setViewMode,
    isFullscreen,
  } = useMagazineStore();

  const effectivePdfUrl = cachedPdfUrl || pdfUrl;

  const deviceInfo = useDeviceDetect();
  const { controlsVisible } = useControlsVisibility();
  const { playPageTurn } = usePageSound();
  useKeyboardNavigation();

  // Determine if we should use portrait (single-page) mode
  const usePortrait = deviceInfo.isMobile || (deviceInfo.isTablet && deviceInfo.isPortrait);

  // Update device type in store
  useEffect(() => {
    setDeviceType(deviceInfo.isMobile, deviceInfo.isTablet);
    if (usePortrait) {
      setViewMode('single');
    } else {
      setViewMode('double');
    }
  }, [deviceInfo, setDeviceType, setViewMode, usePortrait]);

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isFullscreen]);

  // Calculate page dimensions
  const pageDimensions = useMemo(() => {
    const padding = deviceInfo.isMobile ? 16 : 48;
    const controlsHeight = 100;
    const availableWidth = containerSize.width - (padding * 2);
    const availableHeight = containerSize.height - (padding * 2) - controlsHeight;
    const pageAspectRatio = 1 / 1.414; // A4-ish

    if (!usePortrait) {
      // Double-page: each page takes half the available width
      const maxWidthPerPage = availableWidth / 2 - 8;
      const heightFromWidth = maxWidthPerPage / pageAspectRatio;
      if (heightFromWidth > availableHeight) {
        const pageHeight = availableHeight;
        const pageWidth = pageHeight * pageAspectRatio;
        return { width: Math.floor(pageWidth), height: Math.floor(pageHeight) };
      }
      return { width: Math.floor(maxWidthPerPage), height: Math.floor(heightFromWidth) };
    } else {
      // Single-page
      const maxWidth = Math.min(availableWidth, 600);
      const heightFromWidth = maxWidth / pageAspectRatio;
      if (heightFromWidth > availableHeight) {
        const pageHeight = availableHeight;
        const pageWidth = pageHeight * pageAspectRatio;
        return { width: Math.floor(pageWidth), height: Math.floor(pageHeight) };
      }
      return { width: Math.floor(maxWidth), height: Math.floor(heightFromWidth) };
    }
  }, [containerSize, usePortrait, deviceInfo.isMobile]);

  // Handle PDF document load
  const handleDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
  }, [setTotalPages, setLoading, setLoadingProgress]);

  const handleDocumentError = useCallback((error: Error) => {
    console.error('PDF Load Error:', error);
    setError('Failed to load the magazine. Please check your connection and try again.');
  }, [setError]);

  // Handle page flip events from the library
  const handleFlip = useCallback((e: any) => {
    playPageTurn();
    // react-pageflip uses 0-based index
    setCurrentPage(e.data + 1);
  }, [setCurrentPage, playPageTurn]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
  }, [setError, setLoading, setLoadingProgress]);

  // Generate page numbers array
  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  // Error state
  if (error) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center bg-background ${className}`}>
        <div className="max-w-md text-center px-6">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Unable to Load Magazine</h2>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background ${className}`}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-magazine-surface/20 to-background" />

      {/* Hidden PDF Document for loading (just to get page count) */}
      <Document
        file={effectivePdfUrl}
        onLoadSuccess={handleDocumentLoad}
        onLoadError={handleDocumentError}
        loading={null}
        className="hidden"
      />

      {/* Loading state */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30"
          >
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading magazine...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magazine with react-pageflip */}
      {!isLoading && totalPages > 0 && pageDimensions.width > 0 && pageDimensions.height > 0 && (
        <div
          className="relative z-10 flex items-center justify-center"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Ambient shadow beneath book */}
          <div
            className="absolute rounded-full bg-black/20 blur-2xl"
            style={{
              bottom: -32,
              left: '10%',
              right: '10%',
              height: 64,
            }}
          />

          {/* @ts-ignore — react-pageflip types */}
          <HTMLFlipBook
            ref={flipBookRef}
            width={pageDimensions.width}
            height={pageDimensions.height}
            size="fixed"
            minWidth={200}
            maxWidth={pageDimensions.width}
            minHeight={300}
            maxHeight={pageDimensions.height}
            drawShadow={true}
            flippingTime={800}
            usePortrait={usePortrait}
            startZIndex={0}
            autoSize={false}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            clickEventForward={false}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            startPage={0}
            onFlip={handleFlip}
            className="magazine-flipbook"
            style={{}}
          >
            {pageNumbers.map((pageNum) => (
              <FlipPage
                key={pageNum}
                pageNumber={pageNum}
                width={pageDimensions.width}
                height={pageDimensions.height}
                isCover={pageNum === 1 || pageNum === totalPages}
              />
            ))}
          </HTMLFlipBook>
        </div>
      )}

      {/* Navigation hint for mobile */}
      {deviceInfo.isMobile && !isLoading && totalPages > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: controlsVisible ? 0.5 : 0, y: 0 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
        >
          Swipe or tap corners to turn pages
        </motion.div>
      )}

      {/* Controls */}
      <Controls visible={controlsVisible && !isLoading && totalPages > 0} />

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}

export default FlipbookViewer;
