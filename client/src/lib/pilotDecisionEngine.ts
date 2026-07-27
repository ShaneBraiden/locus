import { LivingStudentModel, PilotDecision, ProfileSignals, PracticalConstraints } from "../types";

export function decideNextAction(
  model: LivingStudentModel,
  event: {
    type: "experiment_completed" | "signals_updated" | "constraints_updated";
    payload: any;
  }
): PilotDecision {
  if (event.type === "experiment_completed") {
    const numCompleted = model.completedExperienceIds.length;
    if (numCompleted > 0 && numCompleted % 3 === 0) {
      const hint = model.activeCareerHypotheses && model.activeCareerHypotheses.length > 0 
        ? model.activeCareerHypotheses[0] 
        : undefined;
      return {
        action: "assign_experiment",
        reason: `Student has built up enough evidence (${numCompleted} completed) to warrant fresh curated recommendations.`,
        suggestedCareerHint: hint
      };
    }
  } else if (event.type === "signals_updated") {
    const newSignals = event.payload as Partial<ProfileSignals>;
    let newSignalDetected = false;
    let newLabel = "";
    
    for (const [key, value] of Object.entries(newSignals)) {
      const signalKey = key as keyof ProfileSignals;
      const existingSignal = model.signals[signalKey];
      
      if (value && value.detected && (!existingSignal || !existingSignal.detected)) {
        newSignalDetected = true;
        newLabel = value.label;
        break;
      }
    }
    
    if (newSignalDetected) {
      return {
        action: "update_model",
        reason: `New signal detected: ${newLabel}`
      };
    }
  } else if (event.type === "constraints_updated") {
    const newConstraints = event.payload as Partial<PracticalConstraints>;
    let newConstraintDetected = false;
    let newLabel = "";
    
    for (const [key, value] of Object.entries(newConstraints)) {
      const constraintKey = key as keyof PracticalConstraints;
      const existingConstraint = model.constraints[constraintKey];
      
      if (value && value.detected && (!existingConstraint || !existingConstraint.detected)) {
        newConstraintDetected = true;
        newLabel = value.label;
        break;
      }
    }
    
    if (newConstraintDetected) {
      return {
        action: "update_model",
        reason: `New constraint detected: ${newLabel}`
      };
    }
  }

  return {
    action: "no_action",
    reason: "No new evidence strong enough to act on yet."
  };
}
