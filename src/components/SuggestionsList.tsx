'use client';

interface SuggestionsListProps {
  suggestions: string[];
}

export default function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h4 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        Suggestions to Improve
      </h4>
      <ul className="space-y-1">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
