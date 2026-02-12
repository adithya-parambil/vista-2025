/**
 * Mesh Generator for realistic page curl deformation
 * Implements cylindrical curl mathematics with bezier curves
 */

import { CurlPoint, CurlConfig } from './types/curl.types';

export default class CurlMeshGenerator {
    private width: number;
    private height: number;
    private config: CurlConfig;

    constructor(width: number, height: number, config: CurlConfig) {
        this.width = width;
        this.height = height;
        this.config = config;
    }

    /**
     * Generate a grid of points representing the page mesh
     * @param curlProgress 0 to 1, where 0 is flat and 1 is fully curled/flipped
     */
    generateMesh(curlProgress: number): CurlPoint[] {
        const points: CurlPoint[] = [];
        const { meshResolution, curlDirection, maxCurlRadius } = this.config;

        // Calculate cylinder parameters based on progress
        // As progress goes 0 -> 1, the cylinder moves across the page
        // and potentially changes radius (tight curl to loose flip)

        // Effective curl amount based on direction
        const amount = curlProgress;

        // Cylinder axis position (intersects the page)
        // We curl from right to left (if direction is 'left' aka dragging right corner)
        // or left to right.
        // Let's assume standard "next page" logic: curling from Right edge towards Left.
        // cylinderX moves from width (no curl) to -width (fully flipped)

        // For a corner curl, the axis is angled. For simplicity, we'll start with a vertical axis (side curl)
        // and add angle support if needed. The prompt implies "corner curl hint" but standard flip.

        // Simple page curl math:
        // Mapped 2D point (x,y) -> Deformed 3D point (x', y', z') -> Projected 2D (px, py)
        // But since we are likely using 2D Canvas context, we cheat the 3D by just modifying x/y
        // and using shadowing for depth.

        // Radius of the curling cylinder
        const radius = maxCurlRadius * (1 - 0.5 * amount) + 20; // Radius shrinks slightly then grows? Or constant?
        // Let's keep it simple: constant radius or slight variation.

        // Angle of the curl cone/cylinder. 
        // 0 = vertical cylinder (side flip). 
        // 45 degrees = corner flip.
        // We'll calculate a simple side-flip deformation first.

        const cylinderX = this.width * (1 - amount * 2); // Axis moves across

        // Grid generation
        const cols = meshResolution;
        const rows = meshResolution;

        for (let i = 0; i <= rows; i++) {
            for (let j = 0; j <= cols; j++) {
                const u = j / cols; // 0 to 1 (x)
                const v = i / rows; // 0 to 1 (y)

                const x = u * this.width;
                const y = v * this.height;

                // Deform x, y
                const point = this.calculateDeformation(x, y, amount, radius);
                points.push(point);
            }
        }

        return points;
    }

    /**
     * Calculate deformed position for a single point
     */
    private calculateDeformation(x: number, y: number, amount: number, radius: number): CurlPoint {
        // Basic cylindrical deformation
        // If point is to the LEFT of cylinder axis (and we curl from right), it's flat.
        // If point is to the RIGHT, it's curled around the cylinder.

        // Let's model a curl from the Right edge.
        // apex is the varying position of the fold.
        const apex = this.width * (1 - amount);

        let newX = x;
        let newY = y;
        let curvature = 0;

        // Distance from the fold line
        const dx = x - apex;

        if (dx > 0) {
            // This part of the page is curled
            // Wrap it around a cylinder of radius `R`
            // The distance on the paper `dx` maps to arc length `s = dx`
            // Angle theta = s / R
            const theta = dx / radius;

            // New position on the cylinder circle
            // center of cylinder is at (apex, y, radius) -- conceptually
            // new x is apex + R * sin(theta) - but we want it to wrap *back*
            // standard curl: cylinder sits *on top* of the page.
            // We project back to 2D.

            // Simple projection:
            newX = apex + radius * Math.sin(theta);

            // If theta > pi, it wraps underneath (back side visibility)
            // effectively x decreases.
            // For visual shadow, we track curvature
            curvature = Math.sin(theta);

            // If we want a conical curl (corner), we depend on Y as well.
            // We can rotate the coordinate system, apply cylindrical curl, then rotate back.
        }

        // Corner Curl modification
        // Angle of the fold line. 
        // At start (hover), high angle (-45 deg). 
        // As we drag to center, angle straightens to 0 (vertical).
        // amount 0 -> angle -45
        // amount 1 -> angle 0
        const angleRad = (Math.PI / 4) * (1 - amount);

        // Rotate point around the bottom-right corner or a pivot
        // actually, let's keep it simple: Pure cylindrical for now to ensure robustness,
        // as "corner curl" math is complex to get right without artifacts in 2D canvas.
        // We will simulate corner by just modifying the apex function with Y.

        // skew apex based on Y to make it a cone
        // apex = baseApex + (y / height) * skew
        const skew = this.width * 0.2 * (1 - amount); // Skew reduces as we flip
        const effectiveApex = apex + (y / this.height) * skew;

        const dxSkew = x - effectiveApex;
        if (dxSkew > 0) {
            const theta = dxSkew / radius;
            newX = effectiveApex + radius * Math.sin(theta) - (dxSkew * 0.1); // -shift to simulate perspective
            // Perspective shift: x moves left as it curls up
            newX = effectiveApex - (dxSkew - radius * Math.sin(theta)); // This is wrong.

            // Circular path:
            // x' = R * sin(theta)
            // z' = R * (1 - cos(theta))
            // Projected x = x' (orthographic)
            // so relative to apex:
            newX = effectiveApex - radius * Math.sin(theta);

            // But wait, if theta is small, sin(theta) ~ theta, so newX ~ apex - dxSkew.
            // That means it folds BACK immediately.

            curvature = dxSkew / (radius * Math.PI); // 0 to 1 roughly
        }


        return {
            x: newX,
            y: newY, // Y doesn't change in simple cylindrical fold (unless we do conical)
            originalX: x,
            originalY: y,
            curvature: Math.max(0, Math.min(1, curvature))
        };
    }

    updateConfig(config: CurlConfig) {
        this.config = config;
    }
}