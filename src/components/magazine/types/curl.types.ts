/**
 * Type definitions for enhanced page curl system
 */

// Configuration for page curl behavior
export interface CurlConfig {
  curlSpeed: number;                    // Speed of curl animation (0.5-2.0)
  curlDirection: 'left' | 'right';      // Direction of curl
  curlIntensity: number;                // Intensity (0-1)
  maxCurlRadius: number;                // Maximum curl radius in pixels
  curlTension: number;                  // Tightness of curl (0-1)
  meshResolution: number;               // Mesh grid resolution (10-50)
  enableBackPageRender: boolean;        // Show back page through curl
  enableShadows: boolean;               // Enable shadow effects
}

// A point in the curl mesh
export interface CurlPoint {
  x: number;                            // Current X position
  y: number;                            // Current Y position
  originalX: number;                    // Original X position
  originalY: number;                    // Original Y position
  curvature: number;                    // Bend amount (0-1)
}

// State of a curl at any moment
export interface CurlState {
  isCurling: boolean;                   // Is page currently curling
  currentPoint: CurlPoint;              // Current curl point
  curlProgress: number;                 // Progress (0-1)
  config: CurlConfig;                   // Active configuration
  velocity: number;                     // Current velocity
}

// Physics configuration
export interface PhysicsConfig {
  stiffness: number;                    // Spring stiffness
  damping: number;                      // Damping coefficient
  mass: number;                         // Virtual mass
  friction: number;                     // Drag friction
  maxVelocity: number;                  // Max velocity cap
  returnForce: number;                  // Return to rest force
}

// Page information
export interface PageInfo {
  id: string;
  number: number;
  isCover: boolean;
  width: number;
  height: number;
}

// Animation event callbacks
export interface CurlCallbacks {
  onCurlStart?: () => void;
  onCurling?: (progress: number) => void;
  onCurlComplete?: () => void;
  onFlipStart?: () => void;
  onFlipComplete?: () => void;
}

// Utility type for curl direction
export type CurlDirection = 'left' | 'right';

// Utility type for animation state
export type AnimationState = 'idle' | 'curling' | 'flipping' | 'settling';