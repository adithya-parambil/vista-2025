/**
 * Magazine Configuration
 * 
 * Update these values to customize the magazine for different editions.
 */

export const MAGAZINE_CONFIG = {
  // PDF source - GitHub Releases URL
  // Replace this URL when publishing a new edition
  PDF_URL: 'https://github.com/nickklos10/nickklos10/releases/download/v1.0/magazine.pdf',
  
  // Logo path - stored in public folder
  LOGO_PATH: '/logo.png',
  
  // Branding
  BRAND_NAME: 'Magazine',
  TAGLINE: 'presents',
  
  // Lazy loading configuration
  PRELOAD_COUNT: 5,           // Pages to preload during intro
  LAZY_LOAD_WINDOW: 7,        // Pages to keep ahead of current page
  PAGES_BEHIND: 2,            // Pages to keep behind current page
  MAX_CACHED_PAGES: 15,       // Maximum pages in memory
  
  // Performance settings
  MOBILE_SCALE: 1.0,          // Page scale for mobile devices
  DESKTOP_SCALE: 1.5,         // Page scale for desktop
  TABLET_SCALE: 1.2,          // Page scale for tablets
  
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
