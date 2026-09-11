/**
 * BlackHole Component
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { accretionDiskVertexShader, accretionDiskFragmentShader } from '../shaders/accretionDisk';
import type { SimulationConfig } from '../types/config';
import type { TimelineState } from '../types/timeline';

interface BlackHoleProps {
  config: SimulationConfig;
  timelineState: TimelineState;
}

export const BlackHole: React.FC<BlackHoleProps> = ({ config, timelineState }) => {
  const diskRef = useRef<THREE.Mesh>(null);
  const noiseTextureRef = useRef<THREE.DataTexture | null>(null);
  
  useMemo(() => {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    
    for (let i = 0; i < size * size; i++) {
      const value = Math.random() * 255;
      data[i * 4] = value;
      data[i * 4 + 1] = value;
      data[i * 4 + 2] = value;
      data[i * 4 + 3] = 255;
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    noiseTextureRef.current = texture;
    
    return () => {
      texture.dispose();
    };
  }, []);
  
  const schwarzschildRadius = useMemo(() => {
    const visualScale = 0.001;
    return config.blackHoleMass * visualScale;
  }, [config.blackHoleMass]);
  
  useFrame((state) => {
    if (!diskRef.current) return;
    
    const time = state.clock.elapsedTime;
    diskRef.current.rotation.z += 0.005 / (timelineState.distanceToSingularity + 0.1);
    
    const material = diskRef.current.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.uTime.value = time;
      material.uniforms.uRedshift.value = timelineState.gravitationalRedshift;
      material.uniforms.uDopplerStrength.value = config.dopplerStrength;
      material.uniforms.uCameraPos.value = state.camera.position;
    }
  });
  
  const diskUniforms = useMemo(() => ({
    tNoise: { value: noiseTextureRef.current },
    uTime: { value: 0 },
    uInnerRadius: { value: config.accretionDiskInnerRadius * schwarzschildRadius },
    uOuterRadius: { value: config.accretionDiskOuterRadius * schwarzschildRadius },
    uTemperature: { value: config.accretionDiskTemperature * 10000 },
    uDopplerStrength: { value: config.dopplerStrength },
    uRedshift: { value: timelineState.gravitationalRedshift },
    uCameraPos: { value: new THREE.Vector3() },
    uBlackHolePos: { value: new THREE.Vector3(0, 0, 0) },
  }), [config, schwarzschildRadius, timelineState.gravitationalRedshift]);
  
  return (
    <group>
      {/* Event Horizon */}
      <mesh>
        <sphereGeometry args={[schwarzschildRadius, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Photon sphere glow */}
      <mesh>
        <ringGeometry args={[
          schwarzschildRadius * 1.5,
          schwarzschildRadius * 1.55,
          128
        ]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.1 * timelineState.lensingStrength}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Accretion Disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[
          config.accretionDiskInnerRadius * schwarzschildRadius,
          config.accretionDiskOuterRadius * schwarzschildRadius,
          256,
          32
        ]} />
        <shaderMaterial
          vertexShader={accretionDiskVertexShader}
          fragmentShader={accretionDiskFragmentShader}
          uniforms={diskUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
