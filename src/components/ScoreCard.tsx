'use client';

interface ScoreCardProps {
  label: string;
  score: number;
  subtitle?: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreRingColor(score: number): string {
  if (score >= 75) return 'stroke-emerald-500';
  if (score >= 50) return 'stroke-amber-500';
  return 'stroke-red-500';
}

export default function ScoreCard({ label, score, subtitle }: ScoreCardProps) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            strokeWidth="8"
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-700 ease-out ${getScoreRingColor(score)}`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</p>
      {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}
