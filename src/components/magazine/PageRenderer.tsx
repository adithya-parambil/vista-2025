import { memo, useEffect, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { useMagazineStore } from '@/store/magazineStore';
import { MAGAZINE_CONFIG } from '@/config/magazine';
import { LoadingSpinner } from './LoadingSpinner';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PageRendererProps {
  pageNumber: number;
  width: number;
  height?: number;
  isVisible: boolean;
  isCover?: boolean;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

export const PageRenderer = memo(function PageRenderer({
  pageNumber,
  width,
  height,
  isVisible,
  isCover = false,
  onLoadSuccess,
  onLoadError,
}: PageRendererProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { addCachedPage, addLoadingPage, removeLoadingPage, isMobile, isTablet, pdfUrl } = useMagazineStore();

  // Calculate scale based on device
  const getScale = useCallback(() => {
    if (isMobile) return MAGAZINE_CONFIG.MOBILE_SCALE;
    if (isTablet) return MAGAZINE_CONFIG.TABLET_SCALE;
    return MAGAZINE_CONFIG.DESKTOP_SCALE;
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      addLoadingPage(pageNumber);
    }
  }, [isVisible, isLoaded, pageNumber, addLoadingPage]);

  const handleLoadSuccess = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    removeLoadingPage(pageNumber);
    addCachedPage(pageNumber);
    onLoadSuccess?.();
  }, [pageNumber, removeLoadingPage, addCachedPage, onLoadSuccess]);

  const handleLoadError = useCallback((error: Error) => {
    setHasError(true);
    removeLoadingPage(pageNumber);
    onLoadError?.(error);
  }, [pageNumber, removeLoadingPage, onLoadError]);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0.5 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden bg-magazine-page ${
        isCover ? 'rounded-r-sm shadow-page' : 'rounded-sm shadow-page'
      }`}
      style={{ width, height: height || 'auto' }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center page-skeleton">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <p className="text-sm">Failed to load page {pageNumber}</p>
        </div>
      )}

      {/* PDF Page */}
      <Document
        file={pdfUrl}
        loading={null}
        error={null}
        onLoadError={(error) => handleLoadError(error as Error)}
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          scale={getScale()}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
          onLoadSuccess={handleLoadSuccess}
          onRenderError={(error) => handleLoadError(error as Error)}
          className="magazine-page-content"
        />
      </Document>

      {/* Cover depth effect */}
      {isCover && isLoaded && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black/10 to-transparent" />
      )}
    </motion.div>
  );
});
