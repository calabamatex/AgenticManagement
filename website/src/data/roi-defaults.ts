export interface ROIInputs {
  teamSize: number;
  agentCount: number;
  incidentsPerMonth: number;
  costPerIncident: number;
  oversightHoursPerWeek: number;
  hourlyRate: number;
}

export const defaultInputs: ROIInputs = {
  teamSize: 10,
  agentCount: 5,
  incidentsPerMonth: 4,
  costPerIncident: 5000,
  oversightHoursPerWeek: 8,
  hourlyRate: 85,
};

export const inputRanges = {
  teamSize: { min: 1, max: 200, step: 1, label: 'Team Size (engineers)', prefix: '' },
  agentCount: { min: 1, max: 50, step: 1, label: 'AI Agents in Use', prefix: '' },
  incidentsPerMonth: { min: 0, max: 30, step: 1, label: 'Incidents / Month', prefix: '' },
  costPerIncident: { min: 500, max: 100000, step: 500, label: 'Cost per Incident', prefix: '$' },
  oversightHoursPerWeek: { min: 0, max: 60, step: 1, label: 'Oversight Hours / Week', prefix: '' },
  hourlyRate: { min: 30, max: 300, step: 5, label: 'Engineer Hourly Rate', prefix: '$' },
} as const;
