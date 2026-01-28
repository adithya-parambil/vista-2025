import { useState, useCallback, useRef, useEffect } from 'react';
import { useMagazineStore } from '@/store/magazineStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Maximize, 
  Minimize, 
  ZoomIn, 
  ZoomOut,
  Home
} from 'lucide-react';
import { MAGAZINE_CONFIG } from '@/config/magazine';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlsProps {
  visible: boolean;
}

export function Controls({ visible }: ControlsProps) {
  const {
    currentPage,
    totalPages,
    goToNextPage,
    goToPrevPage,
    jumpToPage,
    isFullscreen,
    toggleFullscreen,
    zoomIn,
    zoomOut,
    zoomLevel,
    pdfUrl,
  } = useMagazineStore();

  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePageInputSubmit = useCallback(() => {
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      jumpToPage(pageNum);
    }
    setIsEditingPage(false);
    setPageInput('');
  }, [pageInput, totalPages, jumpToPage]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = MAGAZINE_CONFIG.DOWNLOAD_FILENAME;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl]);

  useEffect(() => {
    if (isEditingPage && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingPage]);

  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;
  const canZoomIn = zoomLevel < 2;
  const canZoomOut = zoomLevel > 0.5;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-secondary/90 p-2 shadow-controls backdrop-blur-xl">
            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => jumpToPage(1)}
                disabled={currentPage === 1}
                className="control-btn touch-target"
                aria-label="Go to first page"
              >
                <Home className="h-4 w-4" />
              </button>
              
              <button
                onClick={goToPrevPage}
                disabled={!canGoPrev}
                className="control-btn touch-target"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Page indicator */}
              <div className="flex items-center px-2">
                {isEditingPage ? (
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageInputSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePageInputSubmit();
                      if (e.key === 'Escape') {
                        setIsEditingPage(false);
                        setPageInput('');
                      }
                    }}
                    className="w-12 rounded bg-muted px-2 py-1 text-center text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setPageInput(String(currentPage));
                      setIsEditingPage(true);
                    }}
                    className="rounded px-3 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    aria-label="Click to jump to page"
                  >
                    <span className="text-primary">{currentPage}</span>
                    <span className="text-muted-foreground"> / {totalPages}</span>
                  </button>
                )}
              </div>

              <button
                onClick={goToNextPage}
                disabled={!canGoNext}
                className="control-btn touch-target"
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-1 h-8 w-px bg-border" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                disabled={!canZoomOut}
                className="control-btn touch-target"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
                {Math.round(zoomLevel * 100)}%
              </span>
              
              <button
                onClick={zoomIn}
                disabled={!canZoomIn}
                className="control-btn touch-target"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-1 h-8 w-px bg-border" />

            {/* Utility buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                className="control-btn touch-target"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={handleDownload}
                className="control-btn-primary touch-target"
                aria-label="Download magazine"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
