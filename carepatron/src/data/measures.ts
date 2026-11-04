// The questionnaires clients fill in, scored as treatment goes on.

import type { Concern, Persona } from './roster';
import { random } from './random';

interface Scale {
  name: string;
  max: number;
  /** The range a client's first score falls in. */
  start: [number, number];
  /** How much the score drops per session, on average. */
  slope: number;
  /** Severity bands: a score below the number gets the label. */
  bands: [number, string][];
}

const PHQ9: Pick<Scale, 'name' | 'max' | 'bands'> = {
  name: 'PHQ-9',
  max: 27,
  bands: [
    [5, 'minimal'],
    [10, 'mild'],
    [15, 'moderate'],
    [20, 'moderately severe'],
    [28, 'severe'],
  ],
};

// prettier-ignore
const SCALES: Partial<Record<Concern, Scale>> = {
  anxiety:    { name: 'GAD-7', max: 21, start: [12, 17], slope: 0.45, bands: [[5, 'minimal'], [10, 'mild'], [15, 'moderate'], [22, 'severe']] },
  depression: { ...PHQ9, start: [14, 19], slope: 0.55, },
  adjustment: { ...PHQ9, start: [10, 13], slope: 0.4, },
  grief:      { ...PHQ9, start: [12, 16], slope: 0.35, },
  trauma:     { name: 'PCL-5', max: 80, start: [44, 58], slope: 1.6, bands: [[33, 'below the clinical cutoff'], [81, 'probable PTSD']] },
  perinatal:  { name: 'EPDS', max: 30, start: [15, 19], slope: 0.6, bands: [[10, 'below the cutoff'], [13, 'possible depression'], [31, 'probable depression']] },
};

/** A score that starts high and drifts down as treatment works, with some noise. Null when no scale applies. */
export function measure(persona: Persona, session: number): string | null {
  const scale = persona.concern && SCALES[persona.concern];
  if (!scale) return null;
  const start = random(`baseline:${persona.key}`).int(...scale.start);
  const noise = random(`score:${persona.key}:${session}`).int(-2, 2) * (scale.max > 30 ? 3 : 1);
  const score = Math.max(1, Math.min(scale.max, Math.round(start - scale.slope * session + noise)));
  const band = scale.bands.find(([below]) => score < below)?.[1];
  return `<strong>${scale.name}:</strong> ${score} (${band})`;
}
