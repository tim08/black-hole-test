/**
 * CameraController Component
 */

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SimulationConfig } from '../types/config';
import type { TimelineState } from '../types/timeline';

interface CameraControllerProps {
  config: SimulationConfig;
  timelineState: TimelineState;
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  config, 
  timelineState 
}) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  const schwarzschildRadius = config.blackHoleMass * 0.001;
  
  useFrame((state, delta) => {
    switch (timelineState.phase) {
      case 'PRE_START':
        targetPosition.current.set(
          config.observerDistance * schwarzschildRadius,
          schwarzschildRadius * 2,
          0
        );
        break;
        
      case 'EXTERIOR': {
        const exteriorProgress = timelineState.phaseTime / config.exteriorDuration;
        const currentDistance = THREE.MathUtils.lerp(
          config.observerDistance * schwarzschildRadius,
          schwarzschildRadius * 1.5,
          Math.pow(exteriorProgress, 0.7)
        );
        const orbitAngle = exteriorProgress * Math.PI * 0.3;
        
        targetPosition.current.set(
          currentDistance * Math.cos(orbitAngle),
          currentDistance * 0.3,
          currentDistance * Math.sin(orbitAngle)
        );
        break;
      }
        
      case 'HORIZON_CROSSING':
        targetPosition.current.set(schwarzschildRadius * 1.01, 0, 0);
        break;
        
      case 'INTERIOR': {
        const interiorProgress = timelineState.phaseTime / config.interiorDuration;
        const fallDistance = schwarzschildRadius * (1 - Math.pow(interiorProgress, 1.5));
        const spiralAngle = interiorProgress * Math.PI * 2;
        const spiralRadius = fallDistance * 0.3 * (1 - interiorProgress);
        
        targetPosition.current.set(
          spiralRadius * Math.cos(spiralAngle),
          fallDistance * 0.5,
          spiralRadius * Math.sin(spiralAngle)
        );
        targetLookAt.current.set(0, -fallDistance * 0.5, 0);
        break;
      }
        
      case 'SINGULARITY_APPROACH': {
        const approachProgress = timelineState.phaseTime / config.godSequenceDelay;
        const chaosAmplitude = (1 - approachProgress) * schwarzschildRadius * 0.5;
        const chaosFreq = 10;
        
        targetPosition.current.set(
          Math.sin(state.clock.elapsedTime * chaosFreq) * chaosAmplitude,
          Math.cos(state.clock.elapsedTime * chaosFreq * 0.7) * chaosAmplitude,
          Math.sin(state.clock.elapsedTime * chaosFreq * 0.5) * chaosAmplitude
        );
        break;
      }
        
      case 'METAPHYSICAL':
        targetPosition.current.set(0, 5, 0);
        break;
        
      default:
        break;
    }
    
    const lerpFactor = Math.min(delta * 2, 1);
    camera.position.lerp(targetPosition.current, lerpFactor);
    
    const m = new THREE.Matrix4();
    m.lookAt(camera.position, targetLookAt.current, new THREE.Vector3(0, 1, 0));
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromRotationMatrix(m);
    camera.quaternion.slerp(targetQuaternion, lerpFactor);
  });
  
  return null;
};
