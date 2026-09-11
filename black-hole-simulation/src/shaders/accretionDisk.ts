/**
 * Accretion Disk Shader
 * Implements a physically-motivated accretion disk visualization
 * 
 * Physics basis:
 * - Temperature gradient: hotter near black hole (T ~ r^(-3/4) for thin disk)
 * - Relativistic Doppler beaming: brighter on approaching side
 * - Gravitational redshift: light loses energy climbing out
 * - Turbulent plasma structure with magnetic field effects
 */

export const accretionDiskVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vRadius;

uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;

void main() {
  vUv = uv;
  vPosition = position;
  
  // Calculate radius from center
  float radius = length(position.xz);
  vRadius = radius;
  
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const accretionDiskFragmentShader = `
uniform sampler2D tNoise;
uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uTemperature;
uniform float uDopplerStrength;
uniform float uRedshift;
uniform vec3 uCameraPos;
uniform vec3 uBlackHolePos;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vRadius;

// Noise functions for turbulent plasma
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
  
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Blackbody radiation approximation
// Returns color based on temperature (in arbitrary units)
vec3 blackbody(float temperature) {
  // Simplified blackbody curve
  // Hotter = bluer, Cooler = redder
  
  vec3 color;
  float t = temperature / 10000.0; // Normalize
  
  if (t < 0.33) {
    // Cool (red/orange)
    color.r = 1.0;
    color.g = t * 3.0;
    color.b = 0.0;
  } else if (t < 0.66) {
    // Medium (yellow/white)
    color.r = 1.0;
    color.g = 1.0;
    color.b = (t - 0.33) * 3.0;
  } else {
    // Hot (blue/white)
    color.r = (1.0 - t) * 3.0;
    color.g = (1.0 - t) * 3.0;
    color.b = 1.0;
  }
  
  return color;
}

// Relativistic Doppler beaming
// Matter moving toward observer appears brighter and bluer
float dopplerBeaming(vec3 velocity, vec3 viewDir, float speed) {
  // Doppler factor: δ = 1 / (γ(1 - β·n))
  // where β = v/c, γ = 1/sqrt(1-β²), n = view direction
  
  float beta = speed; // Normalized speed (fraction of c)
  float cosAngle = dot(normalize(velocity), normalize(viewDir));
  
  // Simplified: intensity boost proportional to approaching velocity
  float dopplerFactor = 1.0 + uDopplerStrength * beta * cosAngle;
  
  return max(0.1, dopplerFactor);
}

void main() {
  // Normalized radius (0 at inner edge, 1 at outer edge)
  float normalizedRadius = (vRadius - uInnerRadius) / (uOuterRadius - uInnerRadius);
  normalizedRadius = clamp(normalizedRadius, 0.0, 1.0);
  
  // Temperature decreases with radius (T ~ r^(-3/4))
  float temperature = uTemperature * pow(1.0 / (normalizedRadius + 0.1), 0.75);
  
  // Base color from blackbody radiation
  vec3 baseColor = blackbody(temperature);
  
  // Turbulent plasma structure using FBM
  vec2 uv = vUv * vec2(10.0, 1.0); // Stretch along circumference
  
  // Animate the turbulence (rotating disk)
  float rotationSpeed = 2.0 / (vRadius + 0.5); // Faster near center (Keplerian)
  float angle = atan(vPosition.z, vPosition.x);
  float animatedAngle = angle + uTime * rotationSpeed;
  
  vec2 turbulentUV = vec2(animatedAngle * 3.0, normalizedRadius * 5.0);
  float turbulence = fbm(turbulentUV + uTime * 0.5);
  
  // Add spiral arm structure
  float spiralPattern = sin(animatedAngle * 4.0 + normalizedRadius * 10.0 + uTime);
  spiralPattern = smoothstep(-0.5, 0.5, spiralPattern);
  
  // Combine turbulence and spiral pattern
  float density = turbulence * 0.5 + spiralPattern * 0.5;
  density = smoothstep(0.2, 1.0, density);
  
  // Brightness increases toward center (hotter, denser)
  float brightnessGradient = pow(1.0 - normalizedRadius, 2.0);
  
  // Doppler beaming: calculate orbital velocity direction
  vec3 orbitTangent = normalize(cross(vec3(0.0, 1.0, 0.0), normalize(vWorldPosition - uBlackHolePos)));
  vec3 viewDir = normalize(uCameraPos - vWorldPosition);
  
  // Orbital speed increases near black hole (Keplerian: v ~ 1/sqrt(r))
  float orbitalSpeed = 0.4 / sqrt(vRadius / uInnerRadius + 0.1);
  orbitalSpeed = min(orbitalSpeed, 0.95); // Cap below c
  
  float dopplerFactor = dopplerBeaming(orbitTangent, viewDir, orbitalSpeed);
  
  // Apply Doppler to color (also shift toward blue on approaching side)
  vec3 dopplerColor = baseColor;
  dopplerColor.r *= dopplerFactor;
  dopplerColor.g *= dopplerFactor * (0.8 + 0.2 * dopplerFactor);
  dopplerColor.b *= dopplerFactor * (0.6 + 0.4 * dopplerFactor);
  
  // Gravitational redshift (light loses energy escaping)
  float redshiftFactor = 1.0 - uRedshift * (1.0 - normalizedRadius) * 0.5;
  dopplerColor *= redshiftFactor;
  
  // Final color
  vec3 finalColor = dopplerColor * density * brightnessGradient * 3.0;
  
  // Alpha based on density (inner regions more opaque)
  float alpha = density * brightnessGradient * (1.0 - normalizedRadius * 0.5);
  alpha = clamp(alpha, 0.0, 1.0);
  
  // Edge fade
  alpha *= smoothstep(0.0, 0.1, normalizedRadius);
  alpha *= smoothstep(1.0, 0.9, normalizedRadius);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;
