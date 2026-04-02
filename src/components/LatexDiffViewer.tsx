'use client';

import dynamic from 'next/dynamic';

const ReactDiffViewer = dynamic(() => import('react-diff-viewer-continued'), { ssr: false });

interface LatexDiffViewerProps {
  original: string;
  optimized: string;
}

export default function LatexDiffViewer({ original, optimized }: LatexDiffViewerProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <ReactDiffViewer
        oldValue={original}
        newValue={optimized}
        splitView
        leftTitle="Original Resume"
        rightTitle="Optimized Resume"
        useDarkTheme
        styles={{
          contentText: { fontSize: '13px', lineHeight: '1.6' },
        }}
      />
    </div>
  );
}
