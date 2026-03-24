import { features } from '@/data/features';
import FeatureCard from '@/components/features/FeatureCard';

const sections = [
  { maturity: 'stable' as const, heading: 'Production Ready' },
  { maturity: 'beta' as const, heading: 'In Preview' },
  { maturity: 'experimental' as const, heading: 'Experimental' },
];

export const metadata = {
  title: 'Features - AgentSentry',
  description:
    'Everything you need to keep AI agents safe, productive, and accountable.',
};

export default function FeaturesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Features
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Everything you need to keep AI agents safe, productive, and
          accountable.
        </p>
      </div>

      {sections.map((section) => {
        const items = features.filter((f) => f.maturity === section.maturity);
        if (items.length === 0) return null;

        return (
          <div key={section.maturity} className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {section.heading}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
