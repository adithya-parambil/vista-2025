import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAGAZINE_CONFIG } from '@/config/magazine';
import { useMagazineStore } from '@/store/magazineStore';

interface IntroScreenProps {
  onComplete: () => void;
  isReady: boolean;
  downloadProgress?: number;
  isDownloading?: boolean;
}

export function IntroScreen({ onComplete, isReady, downloadProgress = 0, isDownloading = false }: IntroScreenProps) {
  const [showText, setShowText] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    // Show "presents" text after logo animation
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 800);

    return () => clearTimeout(textTimer);
  }, []);

  useEffect(() => {
    // Simulate progress during PDF loading
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90 && !isReady) return prev;
        if (isReady) return 100;
        return Math.min(prev + Math.random() * 15, 90);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isReady]);

  useEffect(() => {
    // Complete intro when ready and minimum time passed
    if (isReady && progress >= 100) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, progress, onComplete]);

  // Use download progress for accurate display
  const displayProgress = isDownloading ? downloadProgress : (isReady ? 100 : progress);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          {!logoError ? (
            <img
              src={MAGAZINE_CONFIG.LOGO_PATH}
              alt={MAGAZINE_CONFIG.BRAND_NAME}
              className="h-20 w-auto object-contain md:h-28"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-20 items-center justify-center md:h-28">
              <span className="text-4xl font-light tracking-widest text-primary md:text-5xl">
                {MAGAZINE_CONFIG.BRAND_NAME}
              </span>
            </div>
          )}
        </motion.div>

        {/* Presents text */}
        <AnimatePresence>
          {showText && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 text-sm font-light uppercase tracking-[0.3em] text-muted-foreground"
            >
              {MAGAZINE_CONFIG.TAGLINE}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Progress bar */}
          <div className="mb-4 h-0.5 w-48 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/50 to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          
          {/* Status text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2 }}
            className="text-xs font-light tracking-wider text-muted-foreground"
          >
            {isDownloading ? 'Downloading Magazine…' : 'Preparing the Magazine…'}
          </motion.p>
        </motion.div>
      </div>

      {/* Ambient glow effect */}
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
    </motion.div>
  );
}
