import { PhysicsConfig, CurlPoint } from './types/curl.types';

export class CurlPhysics {
    private config: PhysicsConfig;
    private position: number;
    private velocity: number;
    private target: number;
    private isInteracting: boolean;
    private lastTime: number;

    constructor(config: PhysicsConfig) {
        this.config = config;
        this.position = 0;
        this.velocity = 0;
        this.target = 0;
        this.isInteracting = false;
        this.lastTime = 0;
    }

    /**
     * Update physics state based on elapsed time
     * Uses simple spring physics: F = -kx - cv
     */
    update(timestamp: number): number {
        if (this.lastTime === 0) {
            this.lastTime = timestamp;
            return this.position;
        }

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap dt to avoid instability
        this.lastTime = timestamp;

        if (this.isInteracting) {
            // During interaction, physics follows the pointer with some lag (mass) or directly
            // For now, we assume direct control during interaction for responsiveness,
            // but we track velocity for release
            return this.position;
        }

        // Spring force (Hooke's Law)
        const displacement = this.position - this.target;
        const springForce = -this.config.stiffness * displacement;

        // Damping force
        const dampingForce = -this.config.damping * this.velocity;

        // Net force
        const force = springForce + dampingForce;

        // Acceleration (F = ma)
        const acceleration = force / this.config.mass;

        // Velocity update
        this.velocity += acceleration * dt;

        // Friction application (simplified)
        if (Math.abs(this.velocity) > 0) {
            this.velocity *= Math.max(0, 1 - (this.config.friction * dt));
        }

        // Velocity cap
        if (Math.abs(this.velocity) > this.config.maxVelocity) {
            this.velocity = Math.sign(this.velocity) * this.config.maxVelocity;
        }

        // Position update
        this.position += this.velocity * dt;

        // Snap to target if close enough and slow enough
        if (Math.abs(displacement) < 0.001 && Math.abs(this.velocity) < 0.01) {
            this.position = this.target;
            this.velocity = 0;
        }

        return this.position;
    }

    /**
     * Set the target position (0 = closed, 1 = open/flipped)
     */
    setTarget(target: number) {
        this.target = Math.max(0, Math.min(1, target));
    }

    /**
     * Set the current position directly (e.g. during drag)
     */
    setPosition(position: number) {
        const newPos = Math.max(0, Math.min(1, position));
        // Calculate velocity based on movement for "throw" effect
        if (this.lastTime > 0) {
            // Approximate velocity from instantaneous movement (simplified)
            // In a real loop, we'd use moving average
        }
        this.position = newPos;
        // When dragging, we are "at the target" effectively for the spring until release
        this.target = newPos;
    }

    /**
     * Start interaction (drag)
     */
    startInteraction() {
        this.isInteracting = true;
        this.velocity = 0;
    }

    /**
     * End interaction (release)
     */
    endInteraction(releaseVelocity?: number) {
        this.isInteracting = false;
        if (releaseVelocity !== undefined) {
            this.velocity = releaseVelocity;
        }
    }

    /**
     * Reset physics state
     */
    reset() {
        this.position = 0;
        this.velocity = 0;
        this.target = 0;
        this.isInteracting = false;
        this.lastTime = 0;
    }

    /**
     * Update configuration
     */
    setConfig(config: PhysicsConfig) {
        this.config = config;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            position: this.position,
            velocity: this.velocity,
            isResting: Math.abs(this.velocity) < 0.001 && Math.abs(this.position - this.target) < 0.001
        };
    }
}