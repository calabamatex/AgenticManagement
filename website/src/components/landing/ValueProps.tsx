import { Shield, Brain, Activity } from 'lucide-react';

const cards = [
  {
    icon: Shield,
    title: 'Agent Safety',
    description:
      'Secret detection, risk scoring, and rules validation catch issues before they reach production. 20+ patterns, real-time scanning.',
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description:
      'Hash-chained event storage with cross-session recall. Your agents remember decisions, errors, and patterns across sessions.',
  },
  {
    icon: Activity,
    title: 'Full Observability',
    description:
      'Structured logging, circuit breakers, health checks, and Prometheus metrics. Know exactly what your agents are doing.',
  },
];

export default function ValueProps() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {cards.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="rounded-xl bg-gray-50 p-8 dark:bg-surface-light"
        >
          <Icon className="h-8 w-8 text-primary" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      ))}
    </div>
  );
}
