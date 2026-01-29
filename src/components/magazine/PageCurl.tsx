import { memo, useMemo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface PageCurlProps {
  children: React.ReactNode;
  width: number;
  height: number;
  isFlipping: boolean;
  flipDirection: 'left' | 'right';
  onFlipComplete?: () => void;
  isCover?: boolean;
  side?: 'left' | 'right';
}

export const PageCurl = memo(function PageCurl({
  children,
  width,
  height,
  isFlipping,
  flipDirection,
  onFlipComplete,
  isCover = false,
  side = 'right',
}: PageCurlProps) {
  // Calculate rotation based on flip direction and page side
  const getFlipAnimation = useMemo(() => {
    if (!isFlipping) {
      return { rotateY: 0, x: 0, scale: 1 };
    }

    // Flipping to next page (right direction)
    if (flipDirection === 'right') {
      return side === 'left' 
        ? { rotateY: 0, x: 0, scale: 1 } // Left page stays
        : { rotateY: -180, x: -width * 0.3, scale: 0.95 }; // Right page flips over
    }
    
    // Flipping to previous page (left direction)
    return side === 'right'
      ? { rotateY: 0, x: 0, scale: 1 } // Right page stays
      : { rotateY: 180, x: width * 0.3, scale: 0.95 }; // Left page flips over
  }, [isFlipping, flipDirection, side, width]);

  return (
    <motion.div
      className="relative preserve-3d"
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
        transformOrigin: side === 'left' ? 'right center' : 'left center',
        perspective: 2000,
      }}
      initial={{ rotateY: 0, x: 0, scale: 1 }}
      animate={getFlipAnimation}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1], // Smooth easing
      }}
      onAnimationComplete={() => {
        if (isFlipping) {
          onFlipComplete?.();
        }
      }}
    >
      {/* Front of page */}
      <div
        className="absolute inset-0 backface-hidden"
        style={{
          backfaceVisibility: 'hidden',
        }}
      >
        {children}
        
        {/* Curl shadow overlay - appears during flip */}
        {isFlipping && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            style={{
              background: side === 'right'
                ? 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 30%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 30%)',
            }}
          />
        )}
      </div>

      {/* Page edge highlight during curl */}
      {isFlipping && (
        <motion.div
          className="absolute top-0 bottom-0 w-2 pointer-events-none"
          style={{
            [side === 'right' ? 'left' : 'right']: 0,
            background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)',
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
});

// Interactive page curl with drag support
interface InteractivePageCurlProps {
  children: React.ReactNode;
  width: number;
  height: number;
  onFlipNext?: () => void;
  onFlipPrev?: () => void;
  canFlipNext?: boolean;
  canFlipPrev?: boolean;
}

export const InteractivePageCurl = memo(function InteractivePageCurl({
  children,
  width,
  height,
  onFlipNext,
  onFlipPrev,
  canFlipNext = true,
  canFlipPrev = true,
}: InteractivePageCurlProps) {
  const x = useMotionValue(0);
  const rotateY = useTransform(x, [-width * 0.5, 0, width * 0.5], [30, 0, -30]);
  const scale = useTransform(x, [-width * 0.5, 0, width * 0.5], [0.95, 1, 0.95]);
  const shadowOpacity = useTransform(x, [-width * 0.5, 0, width * 0.5], [0.3, 0, 0.3]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = width * 0.2;
    
    if (info.offset.x < -threshold && canFlipNext) {
      onFlipNext?.();
    } else if (info.offset.x > threshold && canFlipPrev) {
      onFlipPrev?.();
    }
  };

  return (
    <motion.div
      className="relative cursor-grab active:cursor-grabbing"
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
        perspective: 2000,
        rotateY,
        scale,
        x,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {children}
      
      {/* Dynamic shadow based on drag */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-sm"
        style={{
          opacity: shadowOpacity,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </motion.div>
  );
});
