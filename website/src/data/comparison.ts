export interface ComparisonRow {
  feature: string;
  noGuardrails: string;
  manualReview: string;
  agentSentry: string;
}

export const comparisonData: ComparisonRow[] = [
  {
    feature: 'Secret Detection',
    noGuardrails: 'None',
    manualReview: 'Occasional code review',
    agentSentry: '20+ patterns, real-time',
  },
  {
    feature: 'Cross-Session Memory',
    noGuardrails: 'None — agents forget',
    manualReview: 'Manual notes',
    agentSentry: 'Hash-chained auto-recall',
  },
  {
    feature: 'Risk Scoring',
    noGuardrails: 'None',
    manualReview: 'Gut feeling',
    agentSentry: 'Weighted 0-15 scoring',
  },
  {
    feature: 'Setup Time',
    noGuardrails: '0 min',
    manualReview: 'Ongoing effort',
    agentSentry: '60 seconds',
  },
  {
    feature: 'Ongoing Cost',
    noGuardrails: '$0 + incident costs',
    manualReview: '5-10 hrs/week',
    agentSentry: '$0 (open source)',
  },
  {
    feature: 'Audit Trail',
    noGuardrails: 'None',
    manualReview: 'Scattered logs',
    agentSentry: 'Immutable hash chain',
  },
  {
    feature: 'Progressive Adoption',
    noGuardrails: 'N/A',
    manualReview: 'N/A',
    agentSentry: '5 levels, gradual rollout',
  },
  {
    feature: 'Context Awareness',
    noGuardrails: 'None',
    manualReview: 'Manual tracking',
    agentSentry: 'Auto context estimation',
  },
];
