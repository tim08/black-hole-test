/**
 * UI Component
 * Minimal interface for the simulation
 */

import React from 'react';
import type { SimulationPhase } from '../types/timeline';

interface UIProps {
  phase: SimulationPhase;
  countdownValue: number;
  interiorCountdown: number;
  isRunning: boolean;
  onStart: () => void;
  onRestart: () => void;
}

export const UI: React.FC<UIProps> = ({
  phase,
  countdownValue,
  interiorCountdown,
  isRunning,
  onStart,
  onRestart,
}) => {
  // Start screen
  if (!isRunning) {
    return (
      <div className="start-screen">
        <div className="start-content">
          <h1 className="title">BLACK HOLE</h1>
          <p className="subtitle">A Journey Beyond Physics</p>
          <button className="start-button" onClick={onStart}>
            ENTER THE BLACK HOLE
          </button>
          <div className="warning">
            <p>Scientific visualization based on General Relativity</p>
            <p>Best experienced with headphones in a dark room</p>
          </div>
        </div>
      </div>
    );
  }
  
  // End screen
  if (phase === 'ENDED') {
    return (
      <div className="end-screen">
        <div className="end-content">
          <h2>Journey Complete</h2>
          <button className="restart-button" onClick={onRestart}>
            EXPERIENCE AGAIN
          </button>
        </div>
      </div>
    );
  }
  
  // Countdown display during exterior phase
  const showCountdown = phase === 'EXTERIOR' || phase === 'HORIZON_CROSSING';
  const showInteriorCountdown = phase === 'INTERIOR' || phase === 'SINGULARITY_APPROACH';
  
  return (
    <div className={`simulation-ui ${phase.toLowerCase()}`}>
      {/* Exterior countdown */}
      {showCountdown && (
        <div className="countdown-container">
          <div className="countdown-label">HORIZON CROSSING IN</div>
          <div className="countdown-value">{countdownValue}</div>
        </div>
      )}
      
      {/* Interior countdown */}
      {showInteriorCountdown && (
        <div className="interior-countdown-container">
          <div className="countdown-label">TO SINGULARITY</div>
          <div className="countdown-value">{interiorCountdown}</div>
        </div>
      )}
      
      {/* Phase indicator (subtle) */}
      <div className="phase-indicator">
        {phase === 'EXTERIOR' && 'APPROACHING HORIZON'}
        {phase === 'HORIZON_CROSSING' && 'CROSSING EVENT HORIZON'}
        {phase === 'INTERIOR' && 'FALLING TOWARD SINGULARITY'}
        {phase === 'SINGULARITY_APPROACH' && 'SPACETIME BREAKDOWN'}
        {phase === 'METAPHYSICAL' && ''}
      </div>
      
      {/* Scientific disclaimer for god sequence */}
      {phase === 'METAPHYSICAL' && (
        <div className="metaphysical-disclaimer">
          <p>Beyond this point, physics provides no description.</p>
          <p>What follows is artistic interpretation, not science.</p>
        </div>
      )}
    </div>
  );
};
