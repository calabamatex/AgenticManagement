import type { ROIInputs } from '@/data/roi-defaults';

export interface ROIResults {
  annualIncidentSavings: number;
  annualTimeSavings: number;
  totalAnnualSavings: number;
  setupCost: number;
  paybackDays: number;
  riskReductionPercent: number;
  incidentsPrevented: number;
  hoursReclaimed: number;
}

const PREVENTION_RATE = 0.85;
const OVERSIGHT_REDUCTION = 0.60;

export function calculateROI(inputs: ROIInputs): ROIResults {
  const incidentsPrevented = inputs.incidentsPerMonth * 12 * PREVENTION_RATE;
  const annualIncidentSavings = incidentsPrevented * inputs.costPerIncident;

  const hoursReclaimed = inputs.oversightHoursPerWeek * 52 * OVERSIGHT_REDUCTION;
  const annualTimeSavings = hoursReclaimed * inputs.hourlyRate;

  const totalAnnualSavings = annualIncidentSavings + annualTimeSavings;

  // Setup: ~1 hour per engineer (generous estimate for a 60-second install)
  const setupCost = inputs.teamSize * 1 * inputs.hourlyRate;

  const paybackDays = totalAnnualSavings > 0
    ? Math.max(1, Math.round((setupCost / totalAnnualSavings) * 365))
    : 0;

  const riskReductionPercent = Math.round(PREVENTION_RATE * 100);

  return {
    annualIncidentSavings,
    annualTimeSavings,
    totalAnnualSavings,
    setupCost,
    paybackDays,
    riskReductionPercent,
    incidentsPrevented: Math.round(incidentsPrevented),
    hoursReclaimed: Math.round(hoursReclaimed),
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
