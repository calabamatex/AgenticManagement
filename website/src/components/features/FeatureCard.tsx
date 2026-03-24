'use client';

import { useState } from 'react';
import {
  Plug,
  Link,
  Layers,
  ShieldAlert,
  Gauge,
  Terminal,
  Activity,
  Brain,
  Radio,
  ArrowRightLeft,
  Puzzle,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Feature, Maturity } from '@/data/features';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plug,
  Link,
  Layers,
  ShieldAlert,
  Gauge,
  Terminal,
  Activity,
  Brain,
  Radio,
  ArrowRightLeft,
  Puzzle,
  Users,
};

const maturityStyles: Record<Maturity, string> = {
  stable:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  beta: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  experimental:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const maturityLabels: Record<Maturity, string> = {
  stable: 'Stable',
  beta: 'Beta',
  experimental: 'Experimental',
};

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[feature.icon];

  return (
    <div className="rounded-xl bg-gray-50 p-6 transition-all hover:shadow-lg dark:bg-surface-light">
      <div className="flex items-start justify-between">
        {Icon && <Icon className="h-8 w-8 text-primary" />}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${maturityStyles[feature.maturity]}`}
        >
          {maturityLabels[feature.maturity]}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {feature.description}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
      >
        {expanded ? 'Hide details' : 'Show details'}
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <ul className="mt-3 space-y-1.5 border-t border-gray-200 pt-3 dark:border-gray-700">
          {feature.details.map((detail) => (
            <li
              key={detail}
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              {detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
