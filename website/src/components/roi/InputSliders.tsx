'use client';

import { type ROIInputs, inputRanges } from '@/data/roi-defaults';
import { formatCurrency, formatNumber } from '@/lib/roi-calculator';

interface InputSlidersProps {
  inputs: ROIInputs;
  onChange: (key: keyof ROIInputs, value: number) => void;
}

export default function InputSliders({ inputs, onChange }: InputSlidersProps) {
  const keys = Object.keys(inputRanges) as (keyof ROIInputs)[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {keys.map((key) => {
        const range = inputRanges[key];
        const value = inputs[key];
        const displayValue =
          range.prefix === '$' ? formatCurrency(value) : formatNumber(value);

        return (
          <div
            key={key}
            className="bg-gray-50 dark:bg-surface-light rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor={key}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {range.label}
              </label>
              <span className="text-lg font-semibold text-primary">
                {displayValue}
              </span>
            </div>
            <input
              id={key}
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={value}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>
                {range.prefix}
                {formatNumber(range.min)}
              </span>
              <span>
                {range.prefix}
                {formatNumber(range.max)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
