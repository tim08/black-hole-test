/**
 * FirstPersonView Component
 * Shows first-person perspective after horizon crossing
 * Includes hands/suit elements for immersion
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TimelineState } from '../types/timeline';

interface FirstPersonViewProps {
  timelineState: TimelineState;
}

export const FirstPersonView: React.FC<FirstPersonViewProps> = ({ timelineState }) => {
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const visorRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Subtle hand movement (breathing, slight tremors)
    if (leftHandRef.current) {
      leftHandRef.current.position.y = -0.3 + Math.sin(time * 2) * 0.02;
      leftHandRef.current.rotation.z = Math.sin(time * 1.5) * 0.05;
    }
    
    if (rightHandRef.current) {
      rightHandRef.current.position.y = -0.3 + Math.cos(time * 2) * 0.02;
      rightHandRef.current.rotation.z = -Math.cos(time * 1.5) * 0.05;
    }
    
    // Increase tremor as tidal forces increase
    const tremor = timelineState.tidalForceIntensity * 0.1;
    if (leftHandRef.current) {
      leftHandRef.current.position.x = -0.4 + (Math.random() - 0.5) * tremor;
    }
    if (rightHandRef.current) {
      rightHandRef.current.position.x = 0.4 + (Math.random() - 0.5) * tremor;
    }
    
    // Visor reflection/intensity changes
    if (visorRef.current && visorRef.current.material instanceof THREE.MeshPhysicalMaterial) {
      // Reflection increases with speed/approach to singularity
      const reflectionIntensity = 0.3 + timelineState.cameraProgress * 0.5;
      visorRef.current.material.metalness = reflectionIntensity;
    }
  });
  
  // Only show during interior phases
  if (!timelineState.isFirstResponder) {
    return null;
  }
  
  return (
    <group>
      {/* Left hand/arm */}
      <group 
        ref={leftHandRef} 
        position={[-0.4, -0.3, -0.5]}
        rotation={[0, 0.3, 0]}
      >
        {/* Forearm */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.4, 8]} />
          <meshStandardMaterial 
            color="#cccccc" 
            metalness={0.5} 
            roughness={0.3}
          />
        </mesh>
        
        {/* Gloved hand */}
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial 
            color="#aaaaaa" 
            metalness={0.3} 
            roughness={0.5}
          />
        </mesh>
      </group>
      
      {/* Right hand/arm */}
      <group 
        ref={rightHandRef} 
        position={[0.4, -0.3, -0.5]}
        rotation={[0, -0.3, 0]}
      >
        {/* Forearm */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.4, 8]} />
          <meshStandardMaterial 
            color="#cccccc" 
            metalness={0.5} 
            roughness={0.3}
          />
        </mesh>
        
        {/* Gloved hand */}
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial 
            color="#aaaaaa" 
            metalness={0.3} 
            roughness={0.5}
          />
        </mesh>
      </group>
      
      {/* Helmet visor edge (subtle frame at bottom of screen) */}
      <mesh ref={visorRef} position={[0, -0.45, -0.8]} rotation={[-0.2, 0, 0]}>
        <torusGeometry args={[0.5, 0.02, 4, 32, Math.PI]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.8}
          roughness={0.1}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* HUD elements on visor (minimal) */}
      {timelineState.phase === 'INTERIOR' && (
        <mesh position={[0.3, -0.4, -0.7]}>
          <planeGeometry args={[0.15, 0.08]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent 
            opacity={0.3 * timelineState.tidalForceIntensity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
