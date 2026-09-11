/**
 * TidalEffects Component
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TimelineState } from '../types/timeline';

interface TidalEffectsProps {
  timelineState: TimelineState;
}

export const TidalEffects: React.FC<TidalEffectsProps> = ({ timelineState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleData = React.useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 2;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      colors[i3] = 0.8;
      colors[i3 + 1] = 0.6;
      colors[i3 + 2] = 0.4;
    }
    
    return { positions, colors, count };
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current || !particlesRef.current) return;
    
    const time = state.clock.elapsedTime;
    const tidalIntensity = timelineState.tidalForceIntensity;
    
    const stretchFactor = 1 + tidalIntensity * 3;
    groupRef.current.scale.y = stretchFactor;
    
    const compressFactor = 1 - tidalIntensity * 0.5;
    groupRef.current.scale.x = compressFactor;
    groupRef.current.scale.z = compressFactor;
    
    if (timelineState.phase === 'SINGULARITY_APPROACH') {
      const chaosIntensity = (1 - timelineState.distanceToSingularity) * 5;
      groupRef.current.rotation.x += Math.sin(time * 10) * 0.01 * chaosIntensity;
      groupRef.current.rotation.z += Math.cos(time * 8) * 0.01 * chaosIntensity;
    }
  });
  
  if (timelineState.tidalForceIntensity < 0.1 && timelineState.phase !== 'INTERIOR') {
    return null;
  }
  
  return (
    <group ref={groupRef}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
            count={particleData.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleData.colors, 3]}
            count={particleData.count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
