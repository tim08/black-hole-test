/**
 * Configuration for the black hole simulation
 * All parameters are designed to be scientifically plausible
 * while maintaining real-time performance in browser
 */

export interface SimulationConfig {
  // Black hole properties (in geometric units where G=c=1)
  blackHoleMass: number;        // Mass in solar masses
  blackHoleSpin: number;        // Dimensionless spin parameter 0-1 (Kerr parameter a/M)
  
  // Observer properties
  observerDistance: number;     // Initial distance from black hole (in Schwarzschild radii)
  fallDuration: number;         // Duration of interior fall in seconds
  countdownDuration: number;    // Exterior countdown duration in seconds
  
  // Accretion disk properties
  accretionDiskInnerRadius: number;  // Inner edge (in Schwarzschild radii, typically ~3 for Kerr)
  accretionDiskOuterRadius: number;  // Outer edge (in Schwarzschild radii)
  accretionDiskTemperature: number;  // Peak temperature factor
  diskParticleCount: number;         // Number of particles in disk
  
  // Visual effects
  lensStrength: number;         // Gravitational lensing strength multiplier
  dopplerStrength: number;      // Relativistic Doppler effect strength
  tidalForceStrength: number;   // Spaghettification visual intensity
  redshiftFactor: number;       // Gravitational redshift factor
  
  // Timeline
  exteriorDuration: number;     // Time before horizon crossing (seconds)
  interiorDuration: number;     // Time inside black hole (seconds)
  godSequenceDelay: number;     // Delay before god sequence starts after singularity
  
  // Rendering
  starCount: number;            // Number of background stars
  bloomIntensity: number;       // Post-processing bloom intensity
}

// Default configuration for a supermassive black hole
// Large enough that tidal forces at horizon are survivable briefly
export const defaultConfig: SimulationConfig = {
  // Black hole: ~4 million solar masses (like Sagittarius A*)
  blackHoleMass: 4000000,
  blackHoleSpin: 0.9,          // Rapidly rotating (Kerr black hole)
  
  // Start at 20 Schwarzschild radii
  observerDistance: 20,
  fallDuration: 30,
  countdownDuration: 10,
  
  // Accretion disk extends from ISCO to outer region
  accretionDiskInnerRadius: 2.5,  // Inside ISCO for high spin
  accretionDiskOuterRadius: 15,
  accretionDiskTemperature: 1.0,
  diskParticleCount: 50000,
  
  // Visual effects tuned for plausibility
  lensStrength: 1.0,
  dopplerStrength: 1.0,
  tidalForceStrength: 1.0,
  redshiftFactor: 1.0,
  
  // Timeline phases
  exteriorDuration: 10,
  interiorDuration: 30,
  godSequenceDelay: 2,
  
  // Rendering quality
  starCount: 10000,
  bloomIntensity: 0.8,
};

// Schwarzschild radius in meters for a given mass (in solar masses)
// Rs = 2GM/c^2 ≈ 2950 * M_sun meters
export const SCHWARZSCHILD_RADIUS_PER_SOLAR_MASS = 2950;

export function getSchwarzschildRadius(massInSolarMasses: number): number {
  return massInSolarMasses * SCHWARZSCHILD_RADIUS_PER_SOLAR_MASS;
}

// Innermost Stable Circular Orbit for Kerr black hole
// Approximation formula for prograde orbit
export function getISCO(spin: number): number {
  // Simplified approximation - actual formula is more complex
  // For a=0 (Schwarzschild): ISCO = 6M
  // For a=1 (maximal Kerr): ISCO = 1M (prograde)
  const z1 = 1 + Math.pow(1 - spin * spin, 1/3) * (Math.pow(1 + spin, 1/3) + Math.pow(1 - spin, 1/3));
  const z2 = Math.sqrt(3 * spin * spin + z1 * z1);
  const rISCO = 3 + z2 - Math.sign(spin) * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
  return Math.max(rISCO, 1); // Ensure >= 1 (horizon)
}

// Event horizon radius for Kerr black hole
// r+ = M + sqrt(M^2 - a^2) where a = J/M
export function getEventHorizonRadius(spin: number): number {
  // In geometric units (M=1), r+ = 1 + sqrt(1 - a^2)
  return 1 + Math.sqrt(Math.max(0, 1 - spin * spin));
}

// Photon sphere radius (approximate for Kerr)
export function getPhotonSphereRadius(spin: number): number {
  // For Schwarzschild: r = 3M
  // For Kerr, depends on direction of photon orbit
  // Using equatorial prograde approximation
  const cosAngle = Math.acos(-spin);
  return 2 * (1 + Math.cos(cosAngle / 3));
}
