import { CheckCircle, Package, Clock, Scale } from 'lucide-react';

const badges = [
  { icon: CheckCircle, label: '1,102 Tests Passing' },
  { icon: Package, label: 'Zero Dependencies' },
  { icon: Clock, label: '60-Second Setup' },
  { icon: Scale, label: 'MIT Licensed' },
];

export default function SocialProof() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      {badges.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          <Icon className="h-5 w-5 text-primary" />
          {label}
        </div>
      ))}
    </div>
  );
}
