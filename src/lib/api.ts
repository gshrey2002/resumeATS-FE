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

function getToken(): string {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('Please sign in to use this feature');
  return token;
}

export async function analyzeResume(latexCode: string, jobDescription: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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

/* ---- Resume CRUD (requires auth) ---- */

export interface SavedResumeSummary {
  _id: string;
  name: string;
  lastScore: number | null;
  updatedAt: string;
  createdAt: string;
}

export interface SavedResumeDetail extends SavedResumeSummary {
  latexCode: string;
  lastJobDescription: string;
  lastOptimizedLatex: string;
}

function authHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function listResumes(token: string): Promise<SavedResumeSummary[]> {
  const res = await fetch(`${API_BASE}/api/resumes`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load resumes');
  return res.json();
}

export async function getResume(token: string, id: string): Promise<SavedResumeDetail> {
  const res = await fetch(`${API_BASE}/api/resumes/${id}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load resume');
  return res.json();
}

export async function saveResume(
  token: string,
  data: { name: string; latexCode: string; lastJobDescription?: string; lastOptimizedLatex?: string; lastScore?: number }
): Promise<SavedResumeDetail> {
  const res = await fetch(`${API_BASE}/api/resumes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save resume');
  }
  return res.json();
}

export async function updateResume(
  token: string,
  id: string,
  data: Partial<{ name: string; latexCode: string; lastJobDescription: string; lastOptimizedLatex: string; lastScore: number }>
): Promise<SavedResumeDetail> {
  const res = await fetch(`${API_BASE}/api/resumes/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update resume');
  return res.json();
}

export async function deleteResume(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/resumes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete resume');
}
