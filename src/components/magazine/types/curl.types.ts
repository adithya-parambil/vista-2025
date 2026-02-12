// curl.types.ts

// Interface for configuration settings related to the page curl system
export interface CurlConfig {
    curlSpeed: number; // Speed of the curl motion
    curlDirection: 'left' | 'right'; // Direction of the curl
    curlIntensity: number; // Intensity of the curl effect
}

// Interface representing a point on the page being curled
export interface CurlPoint {
    x: number; // X coordinate
    y: number; // Y coordinate
}

// Interface representing the state of the curl at any moment
export interface CurlState {
    isCurling: boolean; // Indicates if the page is currently curling
    currentPoint: CurlPoint; // The current point being curled
    curlProgress: number; // Progress of the curl between 0 and 1
    config: CurlConfig; // Current configuration settings
}

// Exporting related types
export type { CurlConfig, CurlPoint, CurlState };