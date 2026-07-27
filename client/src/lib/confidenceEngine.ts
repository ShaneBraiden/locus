import { CareerConfidence } from "../types";

export const EXPERIMENT_COMPLETED_MATCH = 8;
export const NEW_SIGNAL_DETECTED = 5;
export const EXPERIMENT_SKIPPED = -3;

export function updateConfidence(
  existing: CareerConfidence[] = [],
  careerPathway: string,
  delta: number,
  reason: string
): CareerConfidence[] {
  console.log(`[Confidence Update] ${careerPathway} | Delta: ${delta > 0 ? "+" : ""}${delta} | Reason: ${reason}`);
  
  const updated = [...existing];
  const existingIndex = updated.findIndex(c => c.careerPathway === careerPathway);
  
  if (existingIndex >= 0) {
    const current = updated[existingIndex];
    updated[existingIndex] = {
      ...current,
      score: Math.max(0, Math.min(100, current.score + delta)),
      evidenceCount: current.evidenceCount + 1,
      lastUpdated: new Date().toISOString()
    };
  } else {
    updated.push({
      careerPathway,
      score: Math.max(0, Math.min(100, 50 + delta)),
      evidenceCount: 1,
      lastUpdated: new Date().toISOString()
    });
  }
  
  return updated;
}
