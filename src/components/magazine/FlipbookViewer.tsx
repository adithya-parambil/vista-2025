import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useMagazineStore } from '@/store/magazineStore';
import { MAGAZINE_CONFIG } from '@/config/magazine';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useControlsVisibility } from '@/hooks/useControlsVisibility';
import { PageRenderer } from './PageRenderer';
import { Controls } from './Controls';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookViewerProps {
  className?: string;
}

export function FlipbookViewer({ className = '' }: FlipbookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');

  const {
    cachedPdfUrl,
    pdfUrl,
    currentPage,
    totalPages,
    setTotalPages,
    goToNextPage,
    goToPrevPage,
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

  // Use cached PDF if available
  const effectivePdfUrl = cachedPdfUrl || pdfUrl;

  const deviceInfo = useDeviceDetect();
  const { controlsVisible } = useControlsVisibility();
  useKeyboardNavigation();

  // Update device type in store
  useEffect(() => {
    setDeviceType(deviceInfo.isMobile, deviceInfo.isTablet);
    
    // Auto-switch to single page on mobile/small tablets
    if (deviceInfo.isMobile || (deviceInfo.isTablet && deviceInfo.isPortrait)) {
      setViewMode('single');
    } else {
      setViewMode('double');
    }
  }, [deviceInfo, setDeviceType, setViewMode]);

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

    // Assume A4-ish aspect ratio (1:1.414)
    const pageAspectRatio = 1 / 1.414;

    if (viewMode === 'double') {
      // Two pages side by side
      const maxWidthPerPage = availableWidth / 2 - 8;
      const heightFromWidth = maxWidthPerPage / pageAspectRatio;
      
      if (heightFromWidth > availableHeight) {
        // Height constrained
        const pageHeight = availableHeight;
        const pageWidth = pageHeight * pageAspectRatio;
        return { width: pageWidth, height: pageHeight };
      }
      
      return { width: maxWidthPerPage, height: heightFromWidth };
    } else {
      // Single page view
      const maxWidth = Math.min(availableWidth, 600);
      const heightFromWidth = maxWidth / pageAspectRatio;
      
      if (heightFromWidth > availableHeight) {
        const pageHeight = availableHeight;
        const pageWidth = pageHeight * pageAspectRatio;
        return { width: pageWidth, height: pageHeight };
      }
      
      return { width: maxWidth, height: heightFromWidth };
    }
  }, [containerSize, viewMode, deviceInfo.isMobile]);

  // Get pages to display
  const displayPages = useMemo(() => {
    if (viewMode === 'single') {
      return [currentPage];
    }
    
    // Double page spread
    // Page 1 (cover) shows alone on the right
    if (currentPage === 1) {
      return [1];
    }
    
    // Ensure we show even-odd pairs (left page should be even)
    const leftPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
    const rightPage = leftPage + 1;
    
    const pages = [leftPage];
    if (rightPage <= totalPages) {
      pages.push(rightPage);
    }
    
    return pages;
  }, [currentPage, viewMode, totalPages]);

  // Pages to preload
  const pagesToLoad = useMemo(() => {
    const pages = new Set<number>();
    
    // Current visible pages
    displayPages.forEach(p => pages.add(p));
    
    // Pages ahead
    for (let i = 1; i <= MAGAZINE_CONFIG.LAZY_LOAD_WINDOW; i++) {
      const ahead = Math.max(...displayPages) + i;
      if (ahead <= totalPages) pages.add(ahead);
    }
    
    // Pages behind
    for (let i = 1; i <= MAGAZINE_CONFIG.PAGES_BEHIND; i++) {
      const behind = Math.min(...displayPages) - i;
      if (behind >= 1) pages.add(behind);
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  }, [displayPages, totalPages]);

  // Handle PDF load
  const handleDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setLoading(false);
    setLoadingProgress(100);
  }, [setTotalPages, setLoading, setLoadingProgress]);

  const handleDocumentError = useCallback((error: Error) => {
    console.error('PDF Load Error:', error);
    setError('Failed to load the magazine. Please check your connection and try again.');
  }, [setError]);

  // Handle swipe navigation
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isFlipping) return;
    
    const threshold = 50;
    
    if (info.offset.x < -threshold && info.velocity.x < 0) {
      // Swipe left - next page
      if (currentPage < totalPages) {
        setFlipDirection('right');
        setIsFlipping(true);
        setTimeout(() => {
          goToNextPage();
          setIsFlipping(false);
        }, 300);
      }
    } else if (info.offset.x > threshold && info.velocity.x > 0) {
      // Swipe right - previous page
      if (currentPage > 1) {
        setFlipDirection('left');
        setIsFlipping(true);
        setTimeout(() => {
          goToPrevPage();
          setIsFlipping(false);
        }, 300);
      }
    }
  }, [currentPage, totalPages, goToNextPage, goToPrevPage, isFlipping]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setLoadingProgress(0);
  }, [setError, setLoading, setLoadingProgress]);

  // Click navigation (click left/right side of book)
  const handleBookClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipping) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;
    
    if (clickX < halfWidth && currentPage > 1) {
      setFlipDirection('left');
      setIsFlipping(true);
      setTimeout(() => {
        goToPrevPage();
        setIsFlipping(false);
      }, 300);
    } else if (clickX >= halfWidth && currentPage < totalPages) {
      setFlipDirection('right');
      setIsFlipping(true);
      setTimeout(() => {
        goToNextPage();
        setIsFlipping(false);
      }, 300);
    }
  }, [currentPage, totalPages, goToNextPage, goToPrevPage, isFlipping]);

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
          
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            Unable to Load Magazine
          </h2>
          
          <p className="mb-6 text-muted-foreground">
            {error}
          </p>
          
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
      
      {/* Hidden PDF Document for loading */}
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

      {/* Magazine pages */}
      {!isLoading && totalPages > 0 && (
        <motion.div
          className="relative z-10 flex items-center justify-center cursor-pointer no-select"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          onClick={handleBookClick}
        >
          {/* Book container with shadow */}
          <div className="relative flex items-stretch gap-1">
            {/* Ambient shadow beneath book */}
            <div className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-black/20 blur-2xl" />
            
            {/* Pages */}
            <AnimatePresence mode="popLayout">
              {displayPages.map((pageNum, index) => (
                <motion.div
                  key={pageNum}
                  initial={{ 
                    opacity: 0, 
                    rotateY: flipDirection === 'right' ? -10 : 10,
                    x: flipDirection === 'right' ? -20 : 20
                  }}
                  animate={{ 
                    opacity: 1, 
                    rotateY: 0,
                    x: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    rotateY: flipDirection === 'right' ? 10 : -10,
                    x: flipDirection === 'right' ? 20 : -20
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{
                    perspective: '2000px',
                    transformStyle: 'preserve-3d',
                  }}
                  className="relative"
                >
                  <PageRenderer
                    pageNumber={pageNum}
                    width={pageDimensions.width}
                    height={pageDimensions.height}
                    isVisible={true}
                    isCover={pageNum === 1}
                  />
                  
                  {/* Page shadow effect */}
                  {viewMode === 'double' && index === 0 && displayPages.length === 2 && (
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                  )}
                  {viewMode === 'double' && index === 1 && (
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Book spine effect (for double page view) */}
            {viewMode === 'double' && displayPages.length === 2 && (
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/5 to-black/10 z-20 pointer-events-none" />
            )}
          </div>

          {/* Preload hidden pages */}
          <div className="hidden">
            {pagesToLoad
              .filter(p => !displayPages.includes(p))
              .map(pageNum => (
                <PageRenderer
                  key={`preload-${pageNum}`}
                  pageNumber={pageNum}
                  width={pageDimensions.width}
                  isVisible={true}
                />
              ))}
          </div>
        </motion.div>
      )}

      {/* Navigation hint for mobile */}
      {deviceInfo.isMobile && !isLoading && totalPages > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: controlsVisible ? 0.5 : 0, y: 0 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
        >
          Swipe to turn pages
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
