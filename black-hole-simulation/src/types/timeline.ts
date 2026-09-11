/**
 * Timeline state management for the black hole simulation
 */

export type SimulationPhase = 
  | 'PRE_START'
  | 'EXTERIOR'
  | 'HORIZON_CROSSING'
  | 'INTERIOR'
  | 'SINGULARITY_APPROACH'
  | 'METAPHYSICAL'
  | 'ENDED';

export interface TimelineState {
  phase: SimulationPhase;
  elapsedTime: number;
  phaseTime: number;
  countdownValue: number;
  interiorCountdown: number;
  distanceToHorizon: number;
  distanceToSingularity: number;
  tidalForceIntensity: number;
  gravitationalRedshift: number;
  lensingStrength: number;
  isFirstResponder: boolean;
  cameraProgress: number;
}

export class TimelineController {
  private startTime: number | null = null;
  private exteriorDuration: number;
  private interiorDuration: number;
  private godSequenceDelay: number;
  
  constructor(
    exteriorDuration: number = 10,
    interiorDuration: number = 30,
    godSequenceDelay: number = 2
  ) {
    this.exteriorDuration = exteriorDuration;
    this.interiorDuration = interiorDuration;
    this.godSequenceDelay = godSequenceDelay;
  }
  
  start(): void {
    this.startTime = performance.now();
  }
  
  getState(): TimelineState {
    const now = performance.now();
    const elapsedTotal = this.startTime !== null 
      ? (now - this.startTime) / 1000 
      : 0;
    
    return this.computeState(elapsedTotal);
  }
  
  computeState(elapsedTotal: number): TimelineState {
    let phase: SimulationPhase = 'PRE_START';
    let phaseTime = 0;
    let countdownValue = this.exteriorDuration;
    let interiorCountdown = this.interiorDuration;
    let distanceToHorizon = 1;
    let distanceToSingularity = 1;
    let tidalForceIntensity = 0;
    let gravitationalRedshift = 0;
    let lensingStrength = 0;
    let isFirstResponder = false;
    let cameraProgress = 0;
    
    if (elapsedTotal < 0) {
      phase = 'PRE_START';
      phaseTime = 0;
    } else if (elapsedTotal < this.exteriorDuration) {
      phase = 'EXTERIOR';
      phaseTime = elapsedTotal;
      countdownValue = Math.ceil(this.exteriorDuration - elapsedTotal);
      
      const progress = elapsedTotal / this.exteriorDuration;
      distanceToHorizon = 1 - Math.pow(progress, 0.7);
      distanceToSingularity = 1;
      tidalForceIntensity = Math.pow(progress, 2) * 0.3;
      gravitationalRedshift = progress * 0.5;
      lensingStrength = 0.5 + progress * 0.5;
      cameraProgress = progress * 0.25;
      
    } else if (elapsedTotal < this.exteriorDuration + 0.5) {
      phase = 'HORIZON_CROSSING';
      phaseTime = elapsedTotal - this.exteriorDuration;
      countdownValue = 0;
      distanceToHorizon = 0;
      distanceToSingularity = 1;
      tidalForceIntensity = 0.3;
      gravitationalRedshift = 0.5;
      lensingStrength = 1.0;
      cameraProgress = 0.25;
      
    } else if (elapsedTotal < this.exteriorDuration + this.interiorDuration) {
      phase = 'INTERIOR';
      phaseTime = elapsedTotal - this.exteriorDuration;
      interiorCountdown = Math.ceil(this.interiorDuration - phaseTime);
      
      const interiorProgress = phaseTime / this.interiorDuration;
      distanceToHorizon = 0;
      distanceToSingularity = 1 - interiorProgress;
      tidalForceIntensity = 0.3 + Math.pow(interiorProgress, 1.5) * 0.7;
      gravitationalRedshift = 0.5 + interiorProgress * 0.5;
      lensingStrength = 1.0 + interiorProgress * 1.5;
      isFirstResponder = true;
      cameraProgress = 0.25 + interiorProgress * 0.65;
      
    } else if (elapsedTotal < this.exteriorDuration + this.interiorDuration + this.godSequenceDelay) {
      phase = 'SINGULARITY_APPROACH';
      phaseTime = elapsedTotal - this.exteriorDuration - this.interiorDuration;
      interiorCountdown = 0;
      distanceToSingularity = 0;
      tidalForceIntensity = 1.0;
      gravitationalRedshift = 1.0;
      lensingStrength = 2.5;
      isFirstResponder = true;
      cameraProgress = 0.9 + (phaseTime / this.godSequenceDelay) * 0.1;
      
    } else {
      phase = 'METAPHYSICAL';
      phaseTime = elapsedTotal - this.exteriorDuration - this.interiorDuration - this.godSequenceDelay;
      interiorCountdown = 0;
      distanceToSingularity = 0;
      tidalForceIntensity = 1.0;
      gravitationalRedshift = 0;
      lensingStrength = 0;
      isFirstResponder = true;
      cameraProgress = 1.0;
    }
    
    return {
      phase,
      elapsedTime: elapsedTotal,
      phaseTime,
      countdownValue,
      interiorCountdown,
      distanceToHorizon,
      distanceToSingularity,
      tidalForceIntensity,
      gravitationalRedshift,
      lensingStrength,
      isFirstResponder,
      cameraProgress,
    };
  }
  
  reset(): void {
    this.startTime = null;
  }
  
  isRunning(): boolean {
    return this.startTime !== null;
  }
  
  getTotalDuration(): number {
    return this.exteriorDuration + this.interiorDuration + this.godSequenceDelay;
  }
}
