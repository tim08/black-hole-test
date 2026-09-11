/**
 * Black Hole Simulation - Main Application
 * A scientifically-motivated visualization of falling into a black hole
 */

import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import { defaultConfig, type SimulationConfig } from './types/config';
import { TimelineController } from './types/timeline';
import { BlackHole } from './components/BlackHole';
import { CameraController } from './components/CameraController';
import { StarField } from './components/StarField';
import { FirstPersonView } from './components/FirstPersonView';
import { TidalEffects } from './components/TidalEffects';
import { GodSequence } from './components/GodSequence';
import { UI } from './components/UI';

import './App.css';

function App() {
  const [config] = useState<SimulationConfig>(defaultConfig);
  const [timelineController] = useState(() => new TimelineController(
    config.exteriorDuration,
    config.interiorDuration,
    config.godSequenceDelay
  ));
  
  // Force re-render for timeline updates
  const [, setTick] = useState(0);
  
  const handleStart = useCallback(() => {
    timelineController.start();
  }, [timelineController]);
  
  const handleRestart = useCallback(() => {
    timelineController.reset();
    setTimeout(() => {
      timelineController.start();
    }, 100);
  }, [timelineController]);
  
  // Get current timeline state
  const timelineState = timelineController.getState();
  
  // Update tick for re-renders
  React.useEffect(() => {
    if (!timelineController.isRunning()) return;
    
    const interval = setInterval(() => {
      setTick(t => t + 1);
      
      // Check if simulation has ended
      const state = timelineController.getState();
      if (state.elapsedTime > timelineController.getTotalDuration() + 5) {
        clearInterval(interval);
      }
    }, 1000 / 30);
    
    return () => clearInterval(interval);
  }, [timelineController]);
  
  const showCanvas = timelineController.isRunning();
  
  return (
    <div className="app">
      <UI
        phase={timelineState.phase}
        countdownValue={timelineState.countdownValue}
        interiorCountdown={timelineState.interiorCountdown}
        isRunning={timelineController.isRunning()}
        onStart={handleStart}
        onRestart={handleRestart}
      />
      
      {showCanvas && (
        <Canvas
          camera={{
            position: [config.observerDistance * 0.001, 0.002, 0],
            fov: 75,
          }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.5,
          }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.1} />
          
          <StarField 
            count={config.starCount} 
            radius={200}
            timelineState={timelineState}
          />
          
          <BlackHole config={config} timelineState={timelineState} />
          
          <CameraController config={config} timelineState={timelineState} />
          
          <FirstPersonView timelineState={timelineState} />
          
          <TidalEffects timelineState={timelineState} />
          
          <GodSequence timelineState={timelineState} />
          
          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={config.bloomIntensity * timelineState.lensingStrength}
              luminanceThreshold={0.8}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  );
}

export default App;
