/**
 * StarField Component
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TimelineState } from '../types/timeline';

interface StarFieldProps {
  count?: number;
  radius?: number;
  timelineState: TimelineState;
}

export const StarField: React.FC<StarFieldProps> = ({
  count = 10000,
  radius = 200,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);
      
      const colorType = Math.random();
      let r, g, b;
      
      if (colorType < 0.6) {
        r = 0.8 + Math.random() * 0.2;
        g = 0.4 + Math.random() * 0.3;
        b = 0.3 + Math.random() * 0.2;
      } else if (colorType < 0.85) {
        r = 0.9 + Math.random() * 0.1;
        g = 0.85 + Math.random() * 0.15;
        b = 0.7 + Math.random() * 0.2;
      } else {
        r = 0.5 + Math.random() * 0.3;
        g = 0.6 + Math.random() * 0.3;
        b = 0.9 + Math.random() * 0.1;
      }
      
      col[i3] = r;
      col[i3 + 1] = g;
      col[i3 + 2] = b;
    }
    
    return { positions: pos, colors: col };
  }, [count, radius]);
  
  useFrame(() => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += 0.0001;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
