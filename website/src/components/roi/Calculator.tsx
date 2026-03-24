'use client';

import { useState } from 'react';
import { type ROIInputs, defaultInputs } from '@/data/roi-defaults';
import { calculateROI } from '@/lib/roi-calculator';
import InputSliders from './InputSliders';
import ResultsDashboard from './ResultsDashboard';
import ComparisonTable from './ComparisonTable';

export default function Calculator() {
  const [inputs, setInputs] = useState<ROIInputs>(defaultInputs);

  const handleChange = (key: keyof ROIInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const results = calculateROI(inputs);

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Your Team
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Adjust the sliders to match your organization.
          </p>
        </div>
        <InputSliders inputs={inputs} onChange={handleChange} />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Projected Impact
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimated annual savings and risk reduction.
          </p>
        </div>
        <ResultsDashboard results={results} />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            How Does AgentSentry Compare?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Feature-by-feature comparison across approaches.
          </p>
        </div>
        <ComparisonTable />
      </section>
    </div>
  );
}
