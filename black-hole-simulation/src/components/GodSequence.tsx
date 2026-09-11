/**
 * GodSequence Component
 * Metaphysical/artistical sequence after physics breaks down
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { godSequenceVertexShader, godSequenceFragmentShader } from '../shaders/godSequence';
import type { TimelineState } from '../types/timeline';

interface GodSequenceProps {
  timelineState: TimelineState;
}

export const GodSequence: React.FC<GodSequenceProps> = ({ timelineState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uRevealProgress: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    tDiffuse: { value: null },
  }), []);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Calculate reveal progress based on phase time
      const phaseTime = timelineState.phaseTime;
      const revealDuration = 5; // Seconds to fully reveal
      
      const progress = Math.min(phaseTime / revealDuration, 1);
      material.uniforms.uRevealProgress.value = progress;
    }
  });
  
  if (timelineState.phase !== 'METAPHYSICAL') {
    return null;
  }
  
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={godSequenceVertexShader}
        fragmentShader={godSequenceFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};
