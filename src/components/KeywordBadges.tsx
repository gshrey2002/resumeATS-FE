'use client';

interface KeywordBadgesProps {
  title: string;
  keywords: string[];
  variant: 'matched' | 'missing';
}

export default function KeywordBadges({ title, keywords, variant }: KeywordBadgesProps) {
  if (keywords.length === 0) return null;

  const badgeClass = variant === 'matched'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <span
            key={kw}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeClass}`}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
