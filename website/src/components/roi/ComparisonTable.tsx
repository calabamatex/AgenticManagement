import { comparisonData } from '@/data/comparison';

export default function ComparisonTable() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-surface-lighter">
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                Feature
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                No Guardrails
              </th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                Manual Review
              </th>
              <th className="px-4 py-3 font-semibold text-primary">
                AgentSentry
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, i) => (
              <tr
                key={row.feature}
                className={
                  i % 2 === 0
                    ? 'bg-gray-50 dark:bg-surface-light'
                    : 'bg-white dark:bg-surface'
                }
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {row.feature}
                </td>
                <td
                  className={`px-4 py-3 ${
                    row.noGuardrails === 'None' ||
                    row.noGuardrails.startsWith('None')
                      ? 'text-gray-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {row.noGuardrails}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {row.manualReview}
                </td>
                <td className="px-4 py-3 text-primary font-medium">
                  {row.agentSentry}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
