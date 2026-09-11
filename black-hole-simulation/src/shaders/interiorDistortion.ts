/**
 * Interior Distortion Shader
 * Applied when inside the black hole to show spacetime breakdown
 * 
 * This is necessarily speculative/hartistic as physics breaks down
 * near the singularity. Based on:
 * - Extreme tidal forces stretching space
 * - Light paths becoming increasingly chaotic
 * - Breakdown of normal spatial relationships
 */

export const interiorDistortionVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform float uTidalIntensity;
uniform float uDistortionStrength;

void main() {
  vUv = uv;
  vPosition = position;
  
  // Apply vertex displacement for tidal stretching effect
  vec3 newPos = position;
  
  // Stretch along fall direction (y-axis in local space)
  float stretchFactor = 1.0 + uTidalIntensity * 2.0;
  newPos.y *= stretchFactor;
  
  // Compress perpendicular directions
  float compressFactor = 1.0 - uTidalIntensity * 0.5;
  newPos.x *= compressFactor;
  newPos.z *= compressFactor;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`;

export const interiorDistortionFragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tStars;
uniform float uTime;
uniform float uTidalIntensity;
uniform float uDistortionStrength;
uniform float uDistanceToSingularity;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;

// Noise functions
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
  
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Tidal distortion of UV coordinates
vec2 applyTidalDistortion(vec2 uv, float intensity, float time) {
  // Space is stretched radially toward singularity
  vec2 center = vec2(0.5, 0.5);
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  
  // Radial stretching increases near singularity
  float stretchAmount = intensity * (1.0 - dist) * 0.3;
  
  // Add chaotic swirling
  float angle = atan(toCenter.y, toCenter.x);
  float swirl = intensity * sin(dist * 20.0 - time * 3.0) * 0.02;
  
  // Turbulent distortion
  vec2 turbulentUV = uv * vec2(5.0, 5.0) + vec2(time * 0.5, time * 0.3);
  float turbulence = fbm(turbulentUV) * intensity * 0.05;
  
  vec2 distortedUV = uv;
  distortedUV += toCenter * stretchAmount;
  distortedUV += vec2(-toCenter.y, toCenter.x) * swirl;
  distortedUV += vec2(turbulence, turbulence);
  
  return distortedUV;
}

// Color shift toward extreme wavelengths
vec3 applyExtremeRedshift(vec3 color, float distanceToSingularity) {
  // As we approach singularity, light becomes infinitely redshifted
  // Eventually all visible light shifts to infrared/radio
  
  float shiftFactor = 1.0 - distanceToSingularity;
  
  // Lose blue first, then green
  color.b *= (1.0 - shiftFactor * 0.8);
  color.g *= (1.0 - shiftFactor * 0.6);
  color.r *= (1.0 - shiftFactor * 0.3);
  
  // Add eerie glow from extreme physics
  vec3 quantumGlow = vec3(0.5, 0.0, 0.8) * shiftFactor * 0.3;
  
  return color + quantumGlow;
}

void main() {
  // Apply tidal distortion to UVs
  vec2 distortedUV = applyTidalDistortion(vUv, uTidalIntensity, uTime);
  
  // Sample stars with distortion
  vec3 starColor = texture2D(tStars, distortedUV).rgb;
  
  // Apply extreme redshift
  starColor = applyExtremeRedshift(starColor, uDistanceToSingularity);
  
  // As singularity approaches, reality breaks down
  float breakdownFactor = 1.0 - uDistanceToSingularity;
  
  // Add visual noise representing quantum gravity effects
  vec2 quantumUV = vUv * vec2(20.0, 20.0) + vec2(uTime * 5.0, uTime * 3.0);
  float quantumNoise = fbm(quantumUV) * breakdownFactor;
  
  // Flash of high-energy radiation near singularity
  float radiationFlash = sin(uTime * 20.0) * 0.5 + 0.5;
  radiationFlash *= breakdownFactor * breakdownFactor;
  
  vec3 radiationColor = vec3(0.8, 0.9, 1.0) * radiationFlash * 0.5;
  
  // Combine
  vec3 finalColor = starColor;
  finalColor += quantumNoise * vec3(0.3, 0.1, 0.5);
  finalColor += radiationColor;
  
  // Desaturate and darken at very end (approaching classical singularity)
  if (uDistanceToSingularity < 0.1) {
    float fadeFactor = uDistanceToSingularity * 10.0;
    finalColor *= fadeFactor;
  }
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
