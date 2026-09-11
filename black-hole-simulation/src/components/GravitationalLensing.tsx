/**
 * GravitationalLensing Component
 * Post-processing effect for gravitational lensing
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  gravitationalLensingVertexShader, 
  gravitationalLensingFragmentShader 
} from '../shaders/gravitationalLensing';
import type { TimelineState } from '../types/timeline';

interface GravitationalLensingProps {
  timelineState: TimelineState;
  starTexture: THREE.DataTexture;
}

export const GravitationalLensing: React.FC<GravitationalLensingProps> = ({
  timelineState,
  starTexture,
}) => {
  const { gl, size } = useThree();
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.OrthographicCamera>(
    new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  );
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  
  // Create render target for the lensing effect
  useEffect(() => {
    renderTargetRef.current = new THREE.WebGLRenderTarget(
      size.width,
      size.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );
    
    return () => {
      renderTargetRef.current?.dispose();
    };
  }, [size.width, size.height]);
  
  // Update render target size on resize
  useEffect(() => {
    if (renderTargetRef.current) {
      renderTargetRef.current.setSize(size.width, size.height);
    }
  }, [size.width, size.height]);
  
  const uniforms = useMemo(() => ({
    tDiffuse: { value: null },
    tStars: { value: starTexture },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uBlackHolePos: { value: new THREE.Vector2(0.5, 0.5) },
    uBlackHoleRadius: { value: 0.15 },
    uLensStrength: { value: timelineState.lensingStrength },
    uTime: { value: 0 },
    uRedshift: { value: timelineState.gravitationalRedshift },
  }), [starTexture, size.width, size.height, timelineState.lensingStrength, timelineState.gravitationalRedshift]);
  
  useEffect(() => {
    materialRef.current = new THREE.ShaderMaterial({
      vertexShader: gravitationalLensingVertexShader,
      fragmentShader: gravitationalLensingFragmentShader,
      uniforms,
    });
    
    return () => {
      materialRef.current?.dispose();
    };
  }, [uniforms]);
  
  useFrame((state) => {
    if (!materialRef.current || !renderTargetRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Update uniforms
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uLensStrength.value = timelineState.lensingStrength;
    materialRef.current.uniforms.uRedshift.value = timelineState.gravitationalRedshift;
    
    // Calculate black hole screen position based on camera angle
    // This is a simplification - proper calculation would need ray tracing
    const cameraDir = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDir);
    
    // Project black hole position (at origin) onto screen
    const bhScreenPos = new THREE.Vector2(
      cameraDir.x * 0.5 + 0.5,
      cameraDir.y * 0.5 + 0.5
    );
    materialRef.current.uniforms.uBlackHolePos.value = bhScreenPos;
    
    // Adjust apparent radius based on distance
    const distanceFactor = timelineState.distanceToHorizon;
    const apparentRadius = 0.1 + (1 - distanceFactor) * 0.3;
    materialRef.current.uniforms.uBlackHoleRadius.value = apparentRadius;
    
    // Render the lensing effect to render target
    gl.setRenderTarget(renderTargetRef.current);
    gl.render(sceneRef.current, cameraRef.current);
    gl.setRenderTarget(null);
  });
  
  // Full-screen quad to display the result
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D tResult;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(tResult, vUv);
          }
        `}
        uniforms={{
          tResult: { value: renderTargetRef.current?.texture || null },
        }}
      />
    </mesh>
  );
};
