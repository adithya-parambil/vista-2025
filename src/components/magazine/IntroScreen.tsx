import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAGAZINE_CONFIG } from '@/config/magazine';
import { useMagazineStore } from '@/store/magazineStore';

interface IntroScreenProps {
  onComplete: () => void;
  isReady: boolean;
}

export function IntroScreen({ onComplete, isReady }: IntroScreenProps) {
  const [showText, setShowText] = useState(false);
  const [progress, setProgress] = useState(0);
  const { loadingProgress } = useMagazineStore();
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 800);

    return () => clearTimeout(textTimer);
  }, []);

  useEffect(() => {
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
    if (isReady && progress >= 100) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, progress, onComplete]);

  const displayProgress = loadingProgress > 0 ? loadingProgress : progress;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background" />

      {/* Main content */}
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

        {/* Presents / tagline */}
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
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center space-y-3 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              transition={{ delay: 1.05, duration: 0.6 }}
              className="text-xs font-light tracking-[0.35em] uppercase text-muted-foreground font-serif"
            >
              Preparing
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6, ease: 'easeOut' }}
              className="text-lg font-semibold tracking-[0.3em] uppercase text-foreground font-serif"
            >
              Anantam
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              transition={{ delay: 1.45, duration: 0.8 }}
              className="text-xs font-light tracking-[0.45em] uppercase text-muted-foreground font-serif"
            >
              Expressions Beyond Time · Echoes Beyond Space
            </motion.p>
          </motion.div>
        </motion.div>
      </div>

      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
    </motion.div>
  );
}
