/**
 * Star field generation utility
 * Creates a procedurally generated star field texture
 */

import * as THREE from 'three';

export interface StarFieldOptions {
  count: number;
  size: number;
  spread: number;
}

export function createStarFieldTexture(
  options: StarFieldOptions = { count: 10000, size: 2048, spread: 100 }
): THREE.DataTexture {
  const { count, size, spread } = options;
  
  const data = new Uint8Array(size * size * 4);
  
  // Generate random star positions
  const stars: Array<{ x: number; y: number; z: number; brightness: number; color: THREE.Color }> = [];
  
  for (let i = 0; i < count; i++) {
    // Spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = spread * Math.sin(phi) * Math.cos(theta);
    const y = spread * Math.sin(phi) * Math.sin(theta);
    const z = spread * Math.cos(phi);
    
    // Brightness variation (most stars are dim, few are bright)
    const brightness = Math.pow(Math.random(), 3);
    
    // Color variation based on stellar classification
    const colorType = Math.random();
    let color: THREE.Color;
    
    if (colorType < 0.6) {
      // M/K type (red/orange dwarfs - most common)
      color = new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.5, 0.5 + Math.random() * 0.3);
    } else if (colorType < 0.85) {
      // G type (yellow like our Sun)
      color = new THREE.Color().setHSL(0.12 + Math.random() * 0.03, 0.4, 0.7 + Math.random() * 0.2);
    } else if (colorType < 0.95) {
      // F/A type (white)
      color = new THREE.Color().setHSL(0.5 + Math.random() * 0.1, 0.1, 0.8 + Math.random() * 0.2);
    } else {
      // O/B type (blue - rare but bright)
      color = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6 + Math.random() * 0.3);
    }
    
    stars.push({ x, y, z, brightness, color });
  }
  
  // Render stars to texture using equirectangular projection
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      
      // Convert pixel to spherical coordinates
      const u = px / size;
      const v = py / size;
      
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      
      // Find stars that project near this pixel
      let r = 0, g = 0, b = 0;
      
      for (const star of stars) {
        // Convert star position to spherical
        const starTheta = Math.atan2(star.y, star.x);
        const starPhi = Math.acos(star.z / spread);
        
        // Angular distance
        let dTheta = theta - starTheta;
        while (dTheta > Math.PI) dTheta -= Math.PI * 2;
        while (dTheta < -Math.PI) dTheta += Math.PI * 2;
        
        const dPhi = phi - starPhi;
        const dist = Math.sqrt(dTheta * dTheta * Math.sin(phi) * Math.sin(phi) + dPhi * dPhi);
        
        // Gaussian falloff for star appearance
        const sigma = 0.002 + (1 - star.brightness) * 0.003;
        const intensity = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        
        if (intensity > 0.001) {
          const scaledIntensity = intensity * star.brightness * 2.0;
          r += star.color.r * scaledIntensity;
          g += star.color.g * scaledIntensity;
          b += star.color.b * scaledIntensity;
        }
      }
      
      // Add subtle background nebula/galaxy glow
      const nebulaNoise = Math.sin(px * 0.05) * Math.cos(py * 0.03) * 0.5 + 0.5;
      r += nebulaNoise * 0.02;
      g += nebulaNoise * 0.015;
      b += nebulaNoise * 0.025;
      
      data[idx] = Math.min(255, r * 255);
      data[idx + 1] = Math.min(255, g * 255);
      data[idx + 2] = Math.min(255, b * 255);
      data[idx + 3] = 255;
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  
  return texture;
}

/**
 * Create a simpler/faster star field for performance
 */
export function createSimpleStarField(
  count: number = 5000,
  radius: number = 100
): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Random spherical distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);
    
    // Color variation
    const colorType = Math.random();
    let r, g, b;
    
    if (colorType < 0.6) {
      // Red/orange
      r = 0.8 + Math.random() * 0.2;
      g = 0.4 + Math.random() * 0.3;
      b = 0.3 + Math.random() * 0.2;
    } else if (colorType < 0.85) {
      // Yellow/white
      r = 0.9 + Math.random() * 0.1;
      g = 0.85 + Math.random() * 0.15;
      b = 0.7 + Math.random() * 0.2;
    } else {
      // Blue
      r = 0.5 + Math.random() * 0.3;
      g = 0.6 + Math.random() * 0.3;
      b = 0.9 + Math.random() * 0.1;
    }
    
    colors[i3] = r;
    colors[i3 + 1] = g;
    colors[i3 + 2] = b;
    
    // Size variation
    sizes[i] = Math.random() * 0.5 + 0.2;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });
  
  return new THREE.Points(geometry, material);
}
