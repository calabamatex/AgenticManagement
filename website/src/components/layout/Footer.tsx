import { Shield } from 'lucide-react';
import Link from 'next/link';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'ROI Calculator', href: '/roi' },
      { label: 'Demo', href: '/demo' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'GitHub', href: 'https://github.com/calabamatex/AgentSentry' },
      { label: 'npm', href: 'https://www.npmjs.com/package/agent-sentry' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Issues', href: 'https://github.com/calabamatex/AgentSentry/issues' },
      { label: 'Discussions', href: 'https://github.com/calabamatex/AgentSentry/discussions' },
      { label: 'Contributing', href: 'https://github.com/calabamatex/AgentSentry/blob/main/CONTRIBUTING.md' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <Shield className="h-6 w-6 text-primary" />
              <span>AgentSentry</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Memory-aware agent safety. Your AI agents never forget — and never go rogue.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-400 dark:border-gray-800">
          <p>Open Source &middot; MIT License &middot; Built for safe AI agent operations</p>
        </div>
      </div>
    </footer>
  );
}
