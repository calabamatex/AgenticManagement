import Calculator from '@/components/roi/Calculator';

export const metadata = {
  title: 'ROI Calculator | AgentSentry',
  description:
    'See how much AgentSentry saves your team in prevented incidents, reclaimed time, and reduced risk.',
};

export default function ROIPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            ROI Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See how much AgentSentry saves your team in prevented incidents,
            reclaimed time, and reduced risk.
          </p>
        </div>

        <Calculator />

        <p className="mt-16 text-center text-xs text-gray-400 dark:text-gray-500 max-w-xl mx-auto">
          Calculations assume 85% incident prevention rate and 60% oversight
          reduction based on typical deployments.
        </p>
      </div>
    </main>
  );
}
