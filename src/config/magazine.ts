/**
 * Magazine Configuration
 * 
 * Update these values to customize the magazine for different editions.
 */

export const MAGAZINE_CONFIG = {
  // PDF source - external URL
  PDF_URL: 'https://vista-2025-nu.vercel.app/Vista.Anantam.pdf',

  // Logo path - stored in public folder
  LOGO_PATH: '/logo.png',

  // Branding
  BRAND_NAME: 'Anantam',
  TAGLINE: 'Expressions Beyond Time · Echoes Beyond Space',

  // Lazy loading configuration (Aggressively reduced for stability)
  PRELOAD_COUNT: 2,           // Pages to preload during intro
  LAZY_LOAD_WINDOW: 2,        // Pages to keep ahead of current page
  PAGES_BEHIND: 1,            // Pages to keep behind current page
  MAX_CACHED_PAGES: 6,        // Maximum pages in memory (Reduced to prevent crashes)

  // Performance settings
  MOBILE_SCALE: 0.6,          // Page scale for mobile devices (Highly optimized for stability)
  DESKTOP_SCALE: 1.2,         // Page scale for desktop (Optimized)
  TABLET_SCALE: 1.0,          // Page scale for tablets (Optimized)

  // UI settings
  CONTROLS_HIDE_DELAY: 3000,  // ms before controls auto-hide
  PAGE_FLIP_DURATION: 600,    // ms for page flip animation

  // Intro screen settings
  INTRO_MIN_DURATION: 2000,   // Minimum intro duration in ms
  INTRO_LOGO_DELAY: 200,      // Delay before logo appears

  // Download filename
  DOWNLOAD_FILENAME: 'Magazine.pdf',
} as const;

export type MagazineConfig = typeof MAGAZINE_CONFIG;
