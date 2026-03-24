export default function ArchitectureDiagram() {
  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="mb-8 text-center text-xl font-bold text-gray-900 dark:text-white">
        Architecture Overview
      </h3>

      {/* Row 1 */}
      <div className="flex justify-center">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-surface-light dark:text-white">
          MCP Server (9 Tools)
        </div>
      </div>

      {/* Arrow down */}
      <div className="flex justify-center">
        <div className="mx-auto h-6 w-0.5 bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-3">
        {['Primitives', 'Memory Store', 'Enrichment'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-surface-light dark:text-white"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Arrow down */}
      <div className="flex justify-center">
        <div className="mx-auto h-6 w-0.5 bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Row 3 */}
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        {['Observability', 'CLI (11 Commands)'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-surface-light dark:text-white"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Arrow down */}
      <div className="flex justify-center">
        <div className="mx-auto h-6 w-0.5 bg-gray-300 dark:bg-gray-600" />
      </div>

      {/* Row 4 */}
      <div className="flex justify-center">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-surface-light dark:text-white">
          Storage: SQLite / Supabase
        </div>
      </div>

      {/* Footer label */}
      <p className="mt-6 text-center text-sm italic text-gray-500 dark:text-gray-500">
        All events are hash-chained for tamper detection
      </p>
    </div>
  );
}
