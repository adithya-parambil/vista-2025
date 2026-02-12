import React, { useRef, useEffect, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { CurlPhysics } from './CurlPhysics';
import { PhysicsConfig } from './types/curl.types';

export interface PageCurlHandle {
    triggerFlip: () => void;
    reset: () => void;
}

interface EnhancedPageCurlProps {
    width: number;
    height: number;
    frontPage: React.ReactNode;
    backPage: React.ReactNode;
    onFlipComplete?: () => void;
    direction?: 'forward' | 'backward';
}

const PHYSICS: PhysicsConfig = {
    stiffness: 80,
    damping: 14,
    mass: 0.8,
    friction: 0.3,
    maxVelocity: 8,
    returnForce: 10
};

export const EnhancedPageCurl = forwardRef<PageCurlHandle, EnhancedPageCurlProps>(({
    width,
    height,
    frontPage,
    backPage,
    onFlipComplete,
    direction = 'forward'
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frontRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>();
    const physicsRef = useRef(new CurlPhysics(PHYSICS));
    const hasFlippedRef = useRef(false);
    const pointerDownRef = useRef(false);
    const startXRef = useRef(0);

    // Reset physics when pages change
    useEffect(() => {
        physicsRef.current.reset();
        hasFlippedRef.current = false;
        if (frontRef.current) {
            frontRef.current.style.clipPath = 'none';
        }
    }, [frontPage, backPage]);

    // Expose triggerFlip to parent
    useImperativeHandle(ref, () => ({
        triggerFlip: () => {
            hasFlippedRef.current = false;
            physicsRef.current.reset();
            physicsRef.current.setTarget(1);
        },
        reset: () => {
            physicsRef.current.reset();
            hasFlippedRef.current = false;
            if (frontRef.current) {
                frontRef.current.style.clipPath = 'none';
            }
        }
    }), []);

    // Animation loop
    const animate = useCallback(() => {
        const physics = physicsRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const front = frontRef.current;

        if (!canvas || !ctx || !front) {
            animRef.current = requestAnimationFrame(animate);
            return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap Max DPR at 2 for performance

        // Handle resizing if needed
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, width, height);

        const pos = physics.update(performance.now());
        const progress = Math.max(0, Math.min(1, pos));

        // Apply clip-path to front page
        if (progress < 0.002) {
            front.style.clipPath = 'none';
        } else {
            const foldX = Math.round(width * (1 - progress));
            front.style.clipPath = `inset(0 ${width - foldX}px 0 0)`;
        }

        // Draw curl effect on canvas
        if (progress > 0.002) {
            const foldX = width * (1 - progress);
            const curlW = Math.min(width * progress * 0.35, 80);

            ctx.save();

            // -- Curl shape (the folded-over paper back) --
            // Use a quadratic curve for a natural bend
            const topX = foldX + curlW * 0.7;
            const midX = foldX + curlW;
            const botX = foldX + curlW * 0.7;

            ctx.beginPath();
            ctx.moveTo(foldX, 0);
            ctx.quadraticCurveTo(topX, height * 0.15, midX, height * 0.5);
            ctx.quadraticCurveTo(botX, height * 0.85, foldX, height);
            ctx.lineTo(foldX, height);
            ctx.lineTo(foldX, 0);
            ctx.closePath();

            // Paper fill
            const paperGrad = ctx.createLinearGradient(foldX, 0, foldX + curlW, 0);
            paperGrad.addColorStop(0, '#e8e8e8');
            paperGrad.addColorStop(0.05, '#f5f5f5');
            paperGrad.addColorStop(0.15, '#ffffff');
            paperGrad.addColorStop(0.6, '#fafafa');
            paperGrad.addColorStop(1, '#f0f0f0');
            ctx.fillStyle = paperGrad;
            ctx.fill();

            // Highlight on the curve
            const hlGrad = ctx.createLinearGradient(foldX, 0, foldX + curlW * 0.3, 0);
            hlGrad.addColorStop(0, 'rgba(255,255,255,0)');
            hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
            hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hlGrad;
            ctx.fill();

            // -- Shadow on the revealed page (left of fold) --
            const shadowW = 25 + 30 * progress;
            const shadowGrad = ctx.createLinearGradient(foldX - shadowW, 0, foldX, 0);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
            ctx.fillStyle = shadowGrad;
            ctx.fillRect(foldX - shadowW, 0, shadowW, height);

            // -- Shadow on the curl (right of fold, under the curl shape) --
            const curlShadowGrad = ctx.createLinearGradient(foldX + curlW, 0, foldX + curlW + 15, 0);
            curlShadowGrad.addColorStop(0, 'rgba(0,0,0,0.12)');
            curlShadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = curlShadowGrad;
            ctx.fillRect(foldX + curlW, 0, 15, height);

            ctx.restore();
        }

        // Check if flip completed
        const state = physics.getState();
        if (!hasFlippedRef.current && state.isResting && state.position > 0.95) {
            hasFlippedRef.current = true;
            onFlipComplete?.();
        }

        animRef.current = requestAnimationFrame(animate);
    }, [width, height, onFlipComplete]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(animate);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [animate]);

    // Pointer-based drag (works on both mouse and touch)
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        pointerDownRef.current = true;
        startXRef.current = e.clientX;
        physicsRef.current.startInteraction();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!pointerDownRef.current) return;
        const dx = startXRef.current - e.clientX; // positive = dragging left = forward
        const progress = Math.max(0, Math.min(1, dx / width));
        physicsRef.current.setPosition(progress);
    }, [width]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!pointerDownRef.current) return;
        pointerDownRef.current = false;

        const dx = startXRef.current - e.clientX;
        const progress = dx / width;
        const physics = physicsRef.current;
        physics.endInteraction();

        // Decide: flip or snap back
        if (progress > 0.25) {
            physics.setTarget(1); // complete the flip
        } else {
            physics.setTarget(0); // snap back
        }
    }, [width]);

    return (
        <div
            style={{
                position: 'relative',
                width,
                height,
                overflow: 'hidden',
                userSelect: 'none',
                touchAction: 'none', // Prevent browser scroll while dragging
            }}
        >
            {/* Layer 0: Back page (revealed underneath) */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
            }}>
                {backPage}
            </div>

            {/* Layer 1: Front page (clipped to reveal back) */}
            <div
                ref={frontRef}
                style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: '#fff',
                    willChange: 'clip-path',
                }}
            >
                {frontPage}
            </div>

            {/* Layer 2: Canvas (curl shape + shadows) */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute', inset: 0, zIndex: 20,
                    pointerEvents: 'none',
                }}
            />

            {/* Layer 3: Full-page drag area */}
            <div
                style={{
                    position: 'absolute', inset: 0, zIndex: 30,
                    cursor: 'grab',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
        </div>
    );
});

EnhancedPageCurl.displayName = 'EnhancedPageCurl';
export default EnhancedPageCurl;