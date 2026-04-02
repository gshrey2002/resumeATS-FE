const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AnalyzeResponse {
  score: {
    overall: number;
    keywordMatch: number;
    skillsCoverage: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  };
  parsedJD: {
    jobTitle: string;
    requiredSkills: string[];
    preferredSkills: string[];
    experienceYears: number | null;
  };
  resumeInfo: {
    sectionsFound: string[];
    skillsExtracted: string[];
    bulletPointCount: number;
  };
}

export interface OptimizeResponse {
  optimizedLatex: string;
  originalScore: number;
  optimizedScore: number;
  improvement: number;
  details: {
    before: { matchedKeywords: string[]; missingKeywords: string[] };
    after: { matchedKeywords: string[]; missingKeywords: string[] };
  };
}

export async function analyzeResume(latexCode: string, jobDescription: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latexCode, jobDescription }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Analysis failed');
  }

  return res.json();
}

export async function optimizeResume(latexCode: string, jobDescription: string): Promise<OptimizeResponse> {
  const res = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latexCode, jobDescription }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Optimization failed');
  }

  return res.json();
}

export async function compilePdf(latexCode: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latexCode }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Compilation failed');
  }

  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
