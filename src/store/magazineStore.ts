import { create } from 'zustand';
import { MAGAZINE_CONFIG } from '@/config/magazine';

export interface MagazineState {
  // PDF state
  pdfUrl: string;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  
  // Cached pages tracking
  cachedPages: Set<number>;
  loadingPages: Set<number>;
  // Page cache with rendered content
  pageCache: Map<number, HTMLCanvasElement>;
  
  // UI state
  isIntroComplete: boolean;
  isFullscreen: boolean;
  zoomLevel: number;
  controlsVisible: boolean;
  isMobile: boolean;
  isTablet: boolean;
  
  // View mode
  viewMode: 'single' | 'double';
  
  // Actions
  setTotalPages: (total: number) => void;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  jumpToPage: (page: number) => void;
  
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  
  addCachedPage: (page: number) => void;
  removeCachedPage: (page: number) => void;
  addLoadingPage: (page: number) => void;
  removeLoadingPage: (page: number) => void;
  setCachedPage: (page: number, canvas: HTMLCanvasElement) => void;
  getCachedPage: (page: number) => HTMLCanvasElement | undefined;
  clearPageCache: () => void;
  
  completeIntro: () => void;
  toggleFullscreen: () => void;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setControlsVisible: (visible: boolean) => void;
  
  setDeviceType: (isMobile: boolean, isTablet: boolean) => void;
  setViewMode: (mode: 'single' | 'double') => void;
  
  reset: () => void;
}

const initialState = {
  pdfUrl: MAGAZINE_CONFIG.PDF_URL,
  totalPages: 0,
  currentPage: 1,
  isLoading: true,
  loadingProgress: 0,
  error: null,
  cachedPages: new Set<number>(),
  loadingPages: new Set<number>(),
  pageCache: new Map<number, HTMLCanvasElement>(),
  isIntroComplete: false,
  isFullscreen: false,
  zoomLevel: 1,
  controlsVisible: true,
  isMobile: false,
  isTablet: false,
  viewMode: 'double' as const,
};

export const useMagazineStore = create<MagazineState>((set, get) => ({
  ...initialState,
  
  setTotalPages: (total) => set({ totalPages: total }),
  
  setCurrentPage: (page) => {
    const { totalPages } = get();
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page });
    }
  },
  
  goToNextPage: () => {
    const { currentPage, totalPages, viewMode } = get();
    const increment = viewMode === 'double' ? 2 : 1;
    const nextPage = Math.min(currentPage + increment, totalPages);
    set({ currentPage: nextPage });
  },
  
  goToPrevPage: () => {
    const { currentPage, viewMode } = get();
    const decrement = viewMode === 'double' ? 2 : 1;
    const prevPage = Math.max(currentPage - decrement, 1);
    set({ currentPage: prevPage });
  },
  
  jumpToPage: (page) => {
    const { totalPages } = get();
    const validPage = Math.max(1, Math.min(page, totalPages));
    set({ currentPage: validPage });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setError: (error) => set({ error, isLoading: false }),
  
  addCachedPage: (page) => {
    const { cachedPages } = get();
    const newCached = new Set(cachedPages);
    newCached.add(page);
    set({ cachedPages: newCached });
  },
  
  removeCachedPage: (page) => {
    const { cachedPages } = get();
    const newCached = new Set(cachedPages);
    newCached.delete(page);
    set({ cachedPages: newCached });
  },
  
  addLoadingPage: (page) => {
    const { loadingPages } = get();
    const newLoading = new Set(loadingPages);
    newLoading.add(page);
    set({ loadingPages: newLoading });
  },
  
  removeLoadingPage: (page) => {
    const { loadingPages } = get();
    const newLoading = new Set(loadingPages);
    newLoading.delete(page);
    set({ loadingPages: newLoading });
  },
  
  completeIntro: () => set({ isIntroComplete: true }),
  
  toggleFullscreen: () => {
    const { isFullscreen } = get();
    
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    
    set({ isFullscreen: !isFullscreen });
  },
  
  setZoomLevel: (level) => {
    const clampedLevel = Math.max(0.5, Math.min(2, level));
    set({ zoomLevel: clampedLevel });
  },
  
  zoomIn: () => {
    const { zoomLevel } = get();
    const newLevel = Math.min(zoomLevel + 0.25, 2);
    set({ zoomLevel: newLevel });
  },
  
  zoomOut: () => {
    const { zoomLevel } = get();
    const newLevel = Math.max(zoomLevel - 0.25, 0.5);
    set({ zoomLevel: newLevel });
  },
  
  setControlsVisible: (visible) => set({ controlsVisible: visible }),
  
  setDeviceType: (isMobile, isTablet) => {
    const viewMode = isMobile ? 'single' : 'double';
    set({ isMobile, isTablet, viewMode });
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),

  setCachedPage: (page, canvas) => {
    const { pageCache } = get();
    const newCache = new Map(pageCache);

    // If cache is full, remove oldest entries (simple FIFO)
    if (newCache.size >= MAGAZINE_CONFIG.MAX_CACHED_PAGES) {
      const keysToDelete = Array.from(newCache.keys()).slice(0, newCache.size - MAGAZINE_CONFIG.MAX_CACHED_PAGES + 1);
      keysToDelete.forEach(key => newCache.delete(key));
    }

    newCache.set(page, canvas);
    set({ pageCache: newCache });
  },

  getCachedPage: (page) => {
    const { pageCache } = get();
    return pageCache.get(page);
  },

  clearPageCache: () => set({ pageCache: new Map() }),

  reset: () => set(initialState),
}));

// Selector hooks for optimized re-renders
export const useCurrentPage = () => useMagazineStore((state) => state.currentPage);
export const useTotalPages = () => useMagazineStore((state) => state.totalPages);
export const useIsLoading = () => useMagazineStore((state) => state.isLoading);
export const useZoomLevel = () => useMagazineStore((state) => state.zoomLevel);
export const useViewMode = () => useMagazineStore((state) => state.viewMode);
export const useIsIntroComplete = () => useMagazineStore((state) => state.isIntroComplete);
