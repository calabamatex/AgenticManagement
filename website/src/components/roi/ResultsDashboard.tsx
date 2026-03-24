'use client';

import { type ROIResults, formatCurrency, formatNumber } from '@/lib/roi-calculator';
import { DollarSign, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ResultsDashboardProps {
  results: ROIResults;
}

const metrics = [
  {
    key: 'totalAnnualSavings' as const,
    label: 'Annual Savings',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    format: (r: ROIResults) => formatCurrency(r.totalAnnualSavings),
  },
  {
    key: 'incidentsPrevented' as const,
    label: 'Incidents Prevented',
    icon: ShieldCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    format: (r: ROIResults) => `${formatNumber(r.incidentsPrevented)}/yr`,
  },
  {
    key: 'hoursReclaimed' as const,
    label: 'Hours Reclaimed',
    icon: Clock,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    format: (r: ROIResults) => `${formatNumber(r.hoursReclaimed)}/yr`,
  },
  {
    key: 'paybackDays' as const,
    label: 'Payback Period',
    icon: TrendingUp,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    format: (r: ROIResults) => `${r.paybackDays} days`,
  },
];

export default function ResultsDashboard({ results }: ResultsDashboardProps) {
  const beforeIncidentCost =
    results.annualIncidentSavings > 0
      ? results.annualIncidentSavings / 0.85
      : 0;
  const beforeTimeCost =
    results.annualTimeSavings > 0 ? results.annualTimeSavings / 0.6 : 0;

  const chartData = [
    {
      name: 'Incident Costs',
      before: Math.round(beforeIncidentCost),
      after: Math.round(beforeIncidentCost - results.annualIncidentSavings),
    },
    {
      name: 'Oversight Hours',
      before: Math.round(beforeTimeCost),
      after: Math.round(beforeTimeCost - results.annualTimeSavings),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.key}
              className="bg-white dark:bg-surface-light rounded-xl p-6"
            >
              <div className={`inline-flex p-2 rounded-lg ${m.bg} mb-3`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {m.format(results)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {m.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-surface-light rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cost Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9ca3af', fontSize: 13 }}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#f3f4f6',
              }}
            />
            <Legend />
            <Bar
              dataKey="before"
              name="Before AgentSentry"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="after"
              name="After AgentSentry"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
