/**
 * Gravitational Lensing Shader
 * Implements screen-space gravitational lensing effect
 * Based on the deflection of light near a massive object
 * 
 * Physics basis:
 * - Light deflection angle: α = 4GM/(c²b) for impact parameter b
 * - For strong lensing near black hole, full geodesic equations needed
 * - This is an approximation suitable for real-time rendering
 */

export const gravitationalLensingVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const gravitationalLensingFragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tStars;
uniform vec2 uResolution;
uniform vec2 uBlackHolePos;      // Screen position of black hole center
uniform float uBlackHoleRadius;  // Apparent radius in screen units
uniform float uLensStrength;     // Strength of lensing effect
uniform float uTime;
uniform float uRedshift;         // Gravitational redshift factor

varying vec2 vUv;
varying vec3 vPosition;

// Einstein ring radius approximation
const float EINSTEIN_RADIUS_FACTOR = 2.5;

// Noise function for accretion disk turbulence
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;
  
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Gravitational deflection calculation
// Returns the distorted UV coordinate
vec2 applyGravitationalLensing(vec2 uv, vec2 bhPos, float bhRadius, float strength) {
  vec2 toBH = uv - bhPos;
  float dist = length(toBH);
  vec2 direction = normalize(toBH);
  
  // Deflection increases near the photon sphere
  // Using simplified deflection formula based on impact parameter
  float einsteinRadius = bhRadius * EINSTEIN_RADIUS_FACTOR;
  
  // Strong lensing regime: multiple images possible
  // We approximate with a smooth deflection profile
  float deflectionAngle;
  
  if (dist < bhRadius) {
    // Inside apparent black hole shadow - no light escapes
    deflectionAngle = 0.0;
  } else if (dist < einsteinRadius * 1.5) {
    // Strong lensing region near photon sphere
    float normalizedDist = (dist - bhRadius) / (einsteinRadius * 1.5 - bhRadius);
    normalizedDist = max(0.01, normalizedDist);
    
    // Deflection ~ 1/impact_parameter for strong field
    deflectionAngle = strength * (1.0 / normalizedDist) * 0.3;
    
    // Add some azimuthal distortion for frame dragging effect
    float angle = atan(toBH.y, toBH.x);
    float frameDrag = strength * 0.1 * exp(-normalizedDist * 2.0);
    direction = vec2(cos(angle + frameDrag), sin(angle + frameDrag));
  } else {
    // Weak lensing far from black hole
    float normalizedDist = dist / einsteinRadius;
    deflectionAngle = strength * (1.0 / (normalizedDist * normalizedDist)) * 0.1;
  }
  
  // Apply deflection
  vec2 distortedUV = uv - direction * deflectionAngle * 0.1;
  
  return distortedUV;
}

// Apply gravitational redshift to color
vec3 applyRedshift(vec3 color, float redshift, float distToBH) {
  // Redshift increases closer to the black hole
  // z = 1/sqrt(1 - Rs/r) - 1 for Schwarzschild
  
  float shiftAmount = redshift * exp(-distToBH * 2.0);
  
  // Shift toward red (decrease blue/green relative to red)
  vec3 shiftedColor = color;
  shiftedColor.g *= (1.0 - shiftAmount * 0.3);
  shiftedColor.b *= (1.0 - shiftAmount * 0.6);
  
  // Also dim the light (gravitational time dilation)
  float dimming = 1.0 - shiftAmount * 0.4;
  
  return shiftedColor * dimming;
}

void main() {
  vec2 uv = vUv;
  
  // Calculate distance to black hole center
  vec2 toBH = uv - uBlackHolePos;
  float distToBH = length(toBH);
  
  // Apply gravitational lensing distortion
  vec2 distortedUV = applyGravitationalLensing(
    uv, 
    uBlackHolePos, 
    uBlackHoleRadius, 
    uLensStrength
  );
  
  // Sample the background (stars) with distortion
  vec3 starColor = texture2D(tStars, distortedUV).rgb;
  
  // Apply gravitational redshift based on distance
  starColor = applyRedshift(starColor, uRedshift, distToBH);
  
  // Create photon ring at photon sphere boundary
  float photonRingRadius = uBlackHoleRadius * EINSTEIN_RADIUS_FACTOR;
  float distToPhotonRing = abs(distToBH - photonRingRadius) / photonRingRadius;
  float photonRing = exp(-distToPhotonRing * 80.0) * uLensStrength;
  
  // Add bright photon ring
  starColor += vec3(1.0, 0.9, 0.8) * photonRing * 0.5;
  
  // Black hole shadow - completely dark inside event horizon
  float shadowMask = smoothstep(uBlackHoleRadius, uBlackHoleRadius * 0.98, distToBH);
  starColor *= shadowMask;
  
  // Add subtle chromatic aberration near the edge (different wavelengths bend differently)
  if (distToBH < uBlackHoleRadius * 3.0 && distToBH > uBlackHoleRadius) {
    float chromaticOffset = uLensStrength * 0.002 * (1.0 - distToBH / (uBlackHoleRadius * 3.0));
    vec2 chromaDir = normalize(toBH);
    
    float rSample = texture2D(tStars, distortedUV - chromaDir * chromaticOffset).r;
    float bSample = texture2D(tStars, distortedUV + chromaDir * chromaticOffset).b;
    
    starColor.r = mix(starColor.r, rSample, 0.3);
    starColor.b = mix(starColor.b, bSample, 0.3);
  }
  
  gl_FragColor = vec4(starColor, 1.0);
}
`;
