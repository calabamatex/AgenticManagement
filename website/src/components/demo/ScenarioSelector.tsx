'use client';

import type { DemoScenario } from '@/data/demo-scenarios';

interface ScenarioSelectorProps {
  scenarios: DemoScenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function ScenarioSelector({
  scenarios,
  activeId,
  onSelect,
}: ScenarioSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {scenarios.map((scenario) => {
        const isActive = scenario.id === activeId;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-surface-light text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-lighter'
            }`}
          >
            <span>{scenario.title}</span>
            <p className="text-xs text-gray-500 mt-0.5 font-normal">
              {scenario.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
