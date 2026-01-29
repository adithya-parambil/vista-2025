import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, useSpring, useAnimationFrame } from 'framer-motion';

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
  const [curlPosition, setCurlPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Natural spring physics for organic movement
  const springConfig = {
    type: "spring" as const,
    stiffness: 80,
    damping: 20,
    mass: 1.2,
  };

  // Calculate realistic flip animation with natural motion
  const getFlipAnimation = useMemo(() => {
    if (!isFlipping) {
      return { 
        rotateY: 0, 
        x: 0, 
        scale: 1,
        rotateX: 0,
        z: 0,
      };
    }

    const depth = 30; // 3D depth effect
    const lift = 15; // Page lift during flip

    if (flipDirection === 'right') {
      return side === 'left' 
        ? { 
            rotateY: 0, 
            x: 0, 
            scale: 1,
            rotateX: 0,
            z: 0,
          }
        : { 
            rotateY: -180, 
            x: -width * 0.25,
            scale: 0.98,
            rotateX: -3, // Slight tilt for realism
            z: lift,
          };
    }
    
    return side === 'right'
      ? { 
          rotateY: 0, 
          x: 0, 
          scale: 1,
          rotateX: 0,
          z: 0,
        }
      : { 
          rotateY: 180, 
          x: width * 0.25,
          scale: 0.98,
          rotateX: 3,
          z: lift,
        };
  }, [isFlipping, flipDirection, side, width]);

  // Draw realistic page curl on canvas
  useEffect(() => {
    if (!canvasRef.current || !isHovering) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw page curl gradient
    const cornerX = side === 'right' ? width : 0;
    const cornerY = height;
    const curlRadius = 80;

    const gradient = ctx.createRadialGradient(
      cornerX, cornerY, 0,
      cornerX, cornerY, curlRadius
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw curl highlight
    const highlightGradient = ctx.createRadialGradient(
      cornerX, cornerY, 0,
      cornerX, cornerY, curlRadius * 0.6
    );

    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(cornerX, cornerY, curlRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }, [isHovering, curlPosition, width, height, side]);

  return (
    <motion.div
      className="relative"
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
        transformOrigin: side === 'left' ? 'right center' : 'left center',
        perspective: 1500,
      }}
      initial={{ rotateY: 0, x: 0, scale: 1, rotateX: 0, z: 0 }}
      animate={getFlipAnimation}
      transition={{
        ...springConfig,
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94], // Natural easing curve
      }}
      onAnimationComplete={() => {
        if (isFlipping) {
          onFlipComplete?.();
        }
      }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCurlPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }}
    >
      {/* Front of page */}
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: 'hidden',
          background: isCover 
            ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
            : '#fefefe',
          boxShadow: isFlipping 
            ? '0 20px 60px rgba(0, 0, 0, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '2px',
        }}
      >
        {children}
        
        {/* Realistic page texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.01) 2px,
                rgba(0, 0, 0, 0.01) 4px
              )
            `,
            mixBlendMode: 'multiply',
            opacity: isCover ? 0 : 0.3,
          }}
        />
        
        {/* Dynamic shadow during flip - organic gradient */}
        {isFlipping && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: side === 'right'
                ? `radial-gradient(ellipse at left center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, transparent 70%)`
                : `radial-gradient(ellipse at right center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, transparent 70%)`,
            }}
          />
        )}

        {/* Canvas for interactive curl effect */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isHovering && !isFlipping ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>

      {/* Back of page (visible when flipped) */}
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#f8f8f8',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '2px',
        }}
      >
        {/* Back side content - mirror or blank */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <span className="text-sm opacity-50">Back</span>
        </div>
      </div>

      {/* Page edge highlight during curl - natural lighting */}
      {isFlipping && (
        <motion.div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            width: '8px',
            [side === 'right' ? 'left' : 'right']: '-4px',
            background: side === 'right'
              ? 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4), transparent)'
              : 'linear-gradient(to left, rgba(255,255,255,0.8), rgba(255,255,255,0.4), transparent)',
            transformStyle: 'preserve-3d',
            zIndex: 10,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}

      {/* Corner curl hint when hovering */}
      {isHovering && !isFlipping && (
        <motion.div
          className="absolute bottom-0 pointer-events-none"
          style={{
            [side === 'right' ? 'right' : 'left']: 0,
            width: 60,
            height: 60,
            background: side === 'right'
              ? 'linear-gradient(135deg, transparent 50%, rgba(200, 200, 200, 0.4) 50%)'
              : 'linear-gradient(225deg, transparent 50%, rgba(200, 200, 200, 0.4) 50%)',
            borderRadius: side === 'right' ? '0 0 2px 0' : '0 0 0 2px',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      )}

      {/* Spine shadow effect */}
      <motion.div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          width: '4px',
          [side === 'left' ? 'right' : 'left']: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)',
          opacity: isFlipping ? 1 : 0.5,
        }}
      />
    </motion.div>
  );
});

// Interactive page curl with realistic drag physics
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
  const [isDragging, setIsDragging] = useState(false);
  const [curlIntensity, setCurlIntensity] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Spring physics for natural, bouncy movement
  const x = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 100, damping: 25, mass: 0.5 });
  
  // Natural transformations based on drag
  const rotateY = useTransform(smoothX, [-width * 0.5, 0, width * 0.5], [25, 0, -25]);
  const rotateX = useTransform(smoothX, [-width * 0.5, 0, width * 0.5], [-2, 0, 2]);
  const scale = useTransform(smoothX, [-width * 0.5, 0, width * 0.5], [0.96, 1, 0.96]);
  const z = useTransform(smoothX, [-width * 0.5, 0, width * 0.5], [10, 0, 10]);
  
  // Dynamic shadows with organic gradients
  const shadowOpacity = useTransform(smoothX, [-width * 0.5, 0, width * 0.5], [0.4, 0, 0.4]);
  const shadowBlur = useTransform(smoothX, [-width * 0.5, 0, width * 0.5], [30, 10, 30]);

  // Draw real-time page curl effect on canvas
  useAnimationFrame(() => {
    if (!canvasRef.current || !isDragging) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const dragAmount = Math.abs(x.get()) / (width * 0.5);
    const curlX = x.get() < 0 ? width : 0;
    const curlY = height * 0.5;
    const radius = Math.min(150, dragAmount * 200);

    // Main curl shadow
    const gradient = ctx.createRadialGradient(curlX, curlY, 0, curlX, curlY, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${dragAmount * 0.4})`);
    gradient.addColorStop(0.4, `rgba(0, 0, 0, ${dragAmount * 0.2})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Curl highlight
    const highlightGradient = ctx.createRadialGradient(
      curlX, curlY, 0,
      curlX, curlY, radius * 0.7
    );
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${dragAmount * 0.3})`);
    highlightGradient.addColorStop(0.6, `rgba(255, 255, 255, ${dragAmount * 0.1})`);
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = highlightGradient;
    ctx.fillRect(0, 0, width, height);

    // Page fold line
    if (dragAmount > 0.1) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${dragAmount * 0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const foldX = x.get() < 0 ? width - (dragAmount * width * 0.3) : dragAmount * width * 0.3;
      ctx.moveTo(foldX, 0);
      ctx.lineTo(foldX, height);
      ctx.stroke();
    }
  });

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = width * 0.25;
    const velocity = Math.abs(info.velocity.x);
    const distance = Math.abs(info.offset.x);
    
    // Natural flip threshold considering both distance and velocity
    const shouldFlip = distance > threshold || (velocity > 500 && distance > threshold * 0.5);
    
    if (info.offset.x < -threshold && canFlipNext && shouldFlip) {
      onFlipNext?.();
    } else if (info.offset.x > threshold && canFlipPrev && shouldFlip) {
      onFlipPrev?.();
    }
    
    setIsDragging(false);
    setCurlIntensity(0);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const intensity = Math.abs(info.offset.x) / (width * 0.5);
    setCurlIntensity(Math.min(intensity, 1));
  };

  return (
    <motion.div
      className="relative cursor-grab active:cursor-grabbing"
      style={{
        width,
        height,
        transformStyle: 'preserve-3d',
        perspective: 1500,
        rotateY,
        rotateX,
        scale,
        x: smoothX,
        z,
      }}
      drag="x"
      dragConstraints={{ left: -width * 0.5, right: width * 0.5 }}
      dragElastic={0.15}
      dragTransition={{ 
        power: 0.3,
        timeConstant: 200,
        bounceDamping: 20,
        bounceStiffness: 300,
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing', scale: 0.99 }}
    >
      {/* Main content */}
      <div 
        className="relative w-full h-full"
        style={{
          background: '#fefefe',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          borderRadius: '3px',
        }}
      >
        {children}
        
        {/* Paper texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.008) 2px,
                rgba(0, 0, 0, 0.008) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.008) 2px,
                rgba(0, 0, 0, 0.008) 4px
              )
            `,
            mixBlendMode: 'multiply',
            opacity: 0.4,
            borderRadius: '3px',
          }}
        />
      </div>
      
      {/* Real-time canvas curl effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDragging ? 1 : 0,
          transition: 'opacity 0.2s ease',
          borderRadius: '3px',
        }}
      />
      
      {/* Dynamic shadow based on drag with organic gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: shadowOpacity,
          filter: `blur(${shadowBlur}px)`,
          background: `radial-gradient(ellipse at center, 
            rgba(0,0,0,0.25) 0%, 
            rgba(0,0,0,0.15) 30%,
            rgba(0,0,0,0.08) 60%,
            transparent 100%)`,
          borderRadius: '3px',
        }}
      />

      {/* Page edges glow during drag */}
      {isDragging && (
        <>
          <motion.div
            className="absolute top-0 bottom-0 w-1 pointer-events-none"
            style={{
              left: 0,
              background: 'linear-gradient(to right, rgba(255,255,255,0.6), transparent)',
              opacity: curlIntensity,
            }}
          />
          <motion.div
            className="absolute top-0 bottom-0 w-1 pointer-events-none"
            style={{
              right: 0,
              background: 'linear-gradient(to left, rgba(255,255,255,0.6), transparent)',
              opacity: curlIntensity,
            }}
          />
        </>
      )}
    </motion.div>
  );
});