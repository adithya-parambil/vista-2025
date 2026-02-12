// Physics configuration interface
interface PhysicsConfig {
    mass: number; // mass of the curl page
    damping: number; // damping factor for simulation
    springConstant: number; // spring constant for spring dynamics
    curlIntensity: number; // intensity of the curl effect
}

class CurlPhysics {
    private position: number;
    private velocity: number;
    private isRest: boolean;
    private config: PhysicsConfig;

    constructor(config: PhysicsConfig) {
        this.config = config;
        this.position = 0;
        this.velocity = 0;
        this.isRest = true;
    }

    update(deltaTime: number): void {
        if (!this.isAtRest()) {
            // Apply spring dynamics
            const springForce = -this.config.springConstant * this.position;
            const dampingForce = -this.config.damping * this.velocity;
            const acceleration = (springForce + dampingForce) / this.config.mass;
            this.velocity += acceleration * deltaTime;
            this.position += this.velocity * deltaTime;
        }
    }

    applyImpulse(impulse: number): void {
        this.velocity += impulse / this.config.mass;
        this.isRest = false;
    }

    getPosition(): number {
        return this.position;
    }

    getVelocity(): number {
        return this.velocity;
    }

    reset(): void {
        this.position = 0;
        this.velocity = 0;
        this.isRest = true;
    }

    isAtRest(): boolean {
        return this.isRest && Math.abs(this.velocity) < 0.001;
    }

    // Easing function for smoother transitions
    static easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // Spring equation for curl intensity
    calculateCurlIntensity(): number {
        return this.config.curlIntensity * this.position;
    }

    // Logic to determine if the flip is completed
    isFlipCompleted(threshold: number): boolean {
        return Math.abs(this.position) > threshold;
    }
}

export { PhysicsConfig, CurlPhysics };