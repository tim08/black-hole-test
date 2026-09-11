/**
 * God Sequence Shader
 * Metaphysical/artistical sequence after physics breaks down
 * 
 * This is purely artistic and not based on any physics.
 * Represents the transition to something beyond physical reality.
 */

export const godSequenceVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform float uRevealProgress;

void main() {
  vUv = uv;
  vPosition = position;
  
  // Gentle vertex animation for ethereal effect
  vec3 newPos = position;
  float wave = sin(uv.x * 10.0 + uTime) * cos(uv.y * 8.0 + uTime * 0.7);
  newPos.z += wave * 0.1 * uRevealProgress;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`;

export const godSequenceFragmentShader = `
uniform float uTime;
uniform float uRevealProgress;
uniform vec2 uResolution;
uniform sampler2D tDiffuse;

varying vec2 vUv;
varying vec3 vPosition;

// Smooth noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  
  for (int i = 0; i < 6; i++) {
    value += amplitude * smoothNoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Divine light rays
float lightRays(vec2 uv, vec2 center, float time) {
  vec2 toCenter = uv - center;
  float angle = atan(toCenter.y, toCenter.x);
  float dist = length(toCenter);
  
  // Rotating rays
  float rayPattern = sin(angle * 12.0 + time * 0.3 + dist * 20.0);
  rayPattern = smoothstep(0.0, 1.0, rayPattern);
  
  // Fade with distance
  rayPattern *= exp(-dist * 2.0);
  
  return rayPattern * 0.5;
}

// Ethereal glow
vec3 divineGlow(vec2 uv, vec2 center, float time) {
  vec2 toCenter = uv - center;
  float dist = length(toCenter);
  
  // Soft inner glow
  float innerGlow = exp(-dist * 4.0);
  
  // Outer aura
  float outerGlow = exp(-dist * 1.5) * 0.5;
  
  // Pulsing
  float pulse = sin(time * 2.0) * 0.1 + 0.9;
  
  // Warm divine colors
  vec3 innerColor = vec3(1.0, 0.95, 0.9) * innerGlow * pulse;
  vec3 outerColor = vec3(0.9, 0.7, 0.5) * outerGlow;
  
  return innerColor + outerColor;
}

// Mysterious figure silhouette (abstract)
float figureSilhouette(vec2 uv, float time) {
  // Abstract humanoid shape using signed distance-like functions
  
  vec2 p = uv * 2.0 - 1.0;
  p.y -= 0.2; // Center vertically
  
  // Body (elongated vertical shape)
  float body = length(vec2(p.x * 3.0, p.y)) - 0.8;
  
  // Head region
  float head = length(vec2(p.x * 4.0, p.y - 0.7)) - 0.3;
  
  // Shoulders
  float shoulders = max(
    length(vec2((p.x - 0.4) * 2.0, p.y - 0.3)),
    length(vec2((p.x + 0.4) * 2.0, p.y - 0.3))
  ) - 0.4;
  
  // Combine
  float figure = min(min(body, head), shoulders);
  
  // Soft edges with glow
  float silhouette = smoothstep(0.1, -0.1, figure);
  
  // Subtle animation
  silhouette += sin(time * 0.5) * 0.02;
  
  return clamp(silhouette, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  vec2 centeredUV = uv - 0.5;
  
  // Base: deep darkness transitioning to light
  float baseBrightness = uRevealProgress;
  vec3 backgroundColor = vec3(baseBrightness * 0.05);
  
  // Divine light from center
  vec2 lightCenter = vec2(0.5, 0.5);
  vec3 glow = divineGlow(uv, lightCenter, uTime);
  glow *= uRevealProgress;
  
  // Light rays
  float rays = lightRays(uv, lightCenter, uTime);
  vec3 rayColor = vec3(1.0, 0.95, 0.85) * rays * uRevealProgress;
  
  // Figure silhouette (appears gradually)
  float figureAlpha = max(0.0, uRevealProgress - 0.3) / 0.7;
  float figure = figureSilhouette(uv, uTime);
  
  // Figure color - warm golden light
  vec3 figureColor = vec3(1.0, 0.9, 0.7) * figure * figureAlpha;
  
  // Add ethereal particles/stars around figure
  vec2 particleUV = uv * vec2(10.0, 15.0);
  float particles = smoothNoise(particleUV + uTime * 0.2);
  particles = step(0.97, particles) * uRevealProgress;
  vec3 particleColor = vec3(1.0, 0.95, 0.8) * particles * 0.5;
  
  // Volumetric light effect
  float volumetric = fbm(uv * vec2(5.0, 3.0) + vec2(uTime * 0.3, 0.0));
  volumetric = smoothstep(0.3, 1.0, volumetric) * 0.3;
  vec3 volumetricColor = vec3(0.9, 0.8, 0.7) * volumetric * uRevealProgress;
  
  // Combine all elements
  vec3 finalColor = backgroundColor;
  finalColor += glow;
  finalColor += rayColor;
  finalColor += volumetricColor;
  finalColor += particleColor;
  finalColor = max(finalColor, figureColor); // Figure appears in front
  
  // Bloom/glow enhancement
  float brightness = dot(finalColor, vec3(0.33));
  finalColor += pow(brightness, 2.0) * 0.3;
  
  // Color grading - warm, peaceful tones
  finalColor = vec3(
    finalColor.r * 1.0,
    finalColor.g * 0.95,
    finalColor.b * 0.85
  );
  
  // Gentle vignette
  float vignette = 1.0 - length(centeredUV) * 0.5;
  finalColor *= vignette;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
