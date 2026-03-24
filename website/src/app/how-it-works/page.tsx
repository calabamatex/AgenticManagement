import ArchitectureDiagram from '@/components/features/ArchitectureDiagram';

const steps = [
  {
    number: 1,
    title: 'Agent Calls MCP Tool',
    description:
      'Your AI agent invokes one of 9 MCP tools via stdio or HTTP. Input is validated with Zod schemas.',
  },
  {
    number: 2,
    title: 'Primitive Computes Result',
    description:
      'The appropriate primitive (risk scoring, secret detection, rules validation, etc.) processes the request in <10ms.',
  },
  {
    number: 3,
    title: 'Event Captured with Hash Chain',
    description:
      'Every action is recorded as an immutable, hash-chained event. Each event links to the previous via SHA-256.',
  },
  {
    number: 4,
    title: 'Auto-Enrichment & Classification',
    description:
      'Events are automatically classified by domain (auth, db, api, testing) with root-cause hints and severity context.',
  },
  {
    number: 5,
    title: 'Cross-Session Recall',
    description:
      'Next session, the agent can recall relevant context via semantic search. Pattern detection identifies recurring issues.',
  },
];

const levels = [
  {
    number: 1,
    title: 'Safe Ground',
    skills: ['save_points'],
    isDefault: false,
  },
  {
    number: 2,
    title: 'Clear Head',
    skills: ['+ context_health'],
    isDefault: true,
  },
  {
    number: 3,
    title: 'House Rules',
    skills: ['+ standing_orders'],
    isDefault: false,
  },
  {
    number: 4,
    title: 'Right Size',
    skills: ['+ small_bets'],
    isDefault: false,
  },
  {
    number: 5,
    title: 'Full Guard',
    skills: ['all skills full'],
    isDefault: false,
  },
];

export const metadata = {
  title: 'How It Works - AgentSentry',
  description:
    'From agent action to institutional memory in five steps.',
};

export default function HowItWorksPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          How It Works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          From agent action to institutional memory in five steps.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative mx-auto mt-16 max-w-2xl">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="relative flex gap-6">
              {/* Number circle */}
              <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {step.number}
              </div>

              {/* Content */}
              <div className="pb-2 pt-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="mt-24">
        <ArchitectureDiagram />
      </div>

      {/* Progressive Enablement */}
      <div className="mt-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Progressive Enablement
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-lg text-gray-600 dark:text-gray-400">
            Adopt at Your Pace
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
          {levels.map((level, i) => (
            <div key={level.number} className="flex items-center">
              {/* Card */}
              <div className="w-40 rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-surface-light">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {level.number}
                </div>
                <h4 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {level.title}
                </h4>
                {level.isDefault && (
                  <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">
                    default
                  </span>
                )}
                <ul className="mt-2 space-y-1">
                  {level.skills.map((skill) => (
                    <li
                      key={skill}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow between cards (not after last) */}
              {i < levels.length - 1 && (
                <div className="hidden h-0.5 w-6 bg-gray-300 dark:bg-gray-600 sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
