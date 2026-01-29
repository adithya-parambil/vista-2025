import { useState, useEffect, useCallback } from 'react';
import { useMagazineStore } from '@/store/magazineStore';

interface PdfCacheResult {
  cachedUrl: string | null;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  retry: () => void;
}

export function usePdfCache(): PdfCacheResult {
  const { pdfUrl, setCachedPdfUrl, cachedPdfUrl, setLoadingProgress } = useMagazineStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(async () => {
    // If already cached, skip download
    if (cachedPdfUrl) {
      setDownloadProgress(100);
      return;
    }

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        received += value.length;
        
        if (total > 0) {
          const progress = Math.round((received / total) * 100);
          setDownloadProgress(progress);
          setLoadingProgress(progress);
        }
      }

      // Combine chunks into single blob
      const blob = new Blob(chunks, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      setCachedPdfUrl(blobUrl);
      setDownloadProgress(100);
      setIsDownloading(false);
      
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
      setIsDownloading(false);
    }
  }, [pdfUrl, cachedPdfUrl, setCachedPdfUrl, setLoadingProgress]);

  const retry = useCallback(() => {
    setError(null);
    downloadPdf();
  }, [downloadPdf]);

  useEffect(() => {
    downloadPdf();
  }, [downloadPdf]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      // Note: We don't revoke here because we want to keep it cached for the session
    };
  }, []);

  return {
    cachedUrl: cachedPdfUrl,
    isDownloading,
    downloadProgress,
    error,
    retry,
  };
}
