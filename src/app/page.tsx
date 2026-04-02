'use client';

import { useState, useCallback, useEffect } from 'react';
import LatexEditor from '@/components/LatexEditor';
import ScoreCard from '@/components/ScoreCard';
import KeywordBadges from '@/components/KeywordBadges';
import SuggestionsList from '@/components/SuggestionsList';
import LatexDiffViewer from '@/components/LatexDiffViewer';
import LandingPage from '@/components/LandingPage';
import { analyzeResume, optimizeResume, compilePdf, downloadBlob, saveResume } from '@/lib/api';
import type { AnalyzeResponse, OptimizeResponse } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Step = 'input' | 'analyzed' | 'optimized';

const SAMPLE_LATEX = `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}

\\begin{document}

\\begin{center}
  {\\LARGE \\textbf{Your Name}} \\\\
  your.email@example.com | +91-XXXXX-XXXXX | LinkedIn: linkedin.com/in/yourname
\\end{center}

\\section{Professional Summary}
Experienced software developer with expertise in building web applications.

\\section{Skills}
\\textbf{Languages:} JavaScript, TypeScript, Python \\\\
\\textbf{Frameworks:} React, Node.js, Express \\\\
\\textbf{Tools:} Git, Docker, AWS

\\section{Experience}
\\textbf{Software Developer} \\hfill Jan 2022 -- Present \\\\
\\textit{Company Name} \\\\
\\begin{itemize}[leftmargin=*]
  \\item Built and maintained web applications serving 10k+ users
  \\item Collaborated with cross-functional teams to deliver features on time
  \\item Improved application performance by 40\\% through code optimization
\\end{itemize}

\\section{Education}
\\textbf{B.Tech Computer Science} \\hfill 2018 -- 2022 \\\\
\\textit{University Name}

\\end{document}`;

export default function Home() {
  const { user, isLoggedIn, token, logout: rawLogout, saveDraft } = useAuth();
  const [latexCode, setLatexCode] = useState(SAMPLE_LATEX);
  const [jobDescription, setJobDescription] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResponse | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resumeName, setResumeName] = useState('');

  // Restore draft: dashboard load > DB draft > sample
  useEffect(() => {
    const raw = sessionStorage.getItem('loaded_resume');
    if (raw) {
      try {
        const resume = JSON.parse(raw);
        if (resume.latexCode) setLatexCode(resume.latexCode);
        if (resume.lastJobDescription) setJobDescription(resume.lastJobDescription);
      } catch { /* ignore */ }
      sessionStorage.removeItem('loaded_resume');
      return;
    }
    if (user?.draftLatex) setLatexCode(user.draftLatex);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft LaTeX to DB (debounced in saveDraft)
  useEffect(() => {
    if (isLoggedIn && latexCode && latexCode !== SAMPLE_LATEX) {
      saveDraft(latexCode, '');
    }
  }, [isLoggedIn, latexCode, saveDraft]);

  const handleAnalyze = useCallback(async () => {
    if (!latexCode.trim() || !jobDescription.trim()) {
      setError('Please provide both your LaTeX resume and the job description.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await analyzeResume(latexCode, jobDescription);
      setAnalysisResult(result);
      setStep('analyzed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [latexCode, jobDescription]);

  const handleOptimize = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const result = await optimizeResume(latexCode, jobDescription);
      setOptimizeResult(result);
      setStep('optimized');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setLoading(false);
    }
  }, [latexCode, jobDescription]);

  const handleDownloadPdf = useCallback(async (latex: string) => {
    setCompiling(true);
    setError('');
    try {
      const blob = await compilePdf(latex);
      const fileName = resumeName.trim() || 'optimized-resume';
      downloadBlob(blob, `${fileName}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF compilation failed');
    } finally {
      setCompiling(false);
    }
  }, [resumeName]);

  const handleDownloadTex = useCallback((latex: string) => {
    const blob = new Blob([latex], { type: 'application/x-tex' });
    const fileName = resumeName.trim() || 'optimized-resume';
    downloadBlob(blob, `${fileName}.tex`);
  }, [resumeName]);

  const handleReset = useCallback(() => {
    setStep('input');
    setAnalysisResult(null);
    setOptimizeResult(null);
    setShowDiff(false);
    setError('');
    setSaveMsg('');
  }, []);

  const handleLogout = useCallback(() => {
    rawLogout();
    setLatexCode(SAMPLE_LATEX);
    setJobDescription('');
    setStep('input');
    setAnalysisResult(null);
    setOptimizeResult(null);
    setShowDiff(false);
    setError('');
    setSaveMsg('');
    setResumeName('');
  }, [rawLogout]);

  const handleSaveResume = useCallback(async () => {
    if (!token || !optimizeResult) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const name = resumeName.trim() || `Resume ${new Date().toLocaleDateString()}`;
      await saveResume(token, {
        name,
        latexCode,
        lastJobDescription: jobDescription,
        lastOptimizedLatex: optimizeResult.optimizedLatex,
        lastScore: optimizeResult.optimizedScore,
      });
      setSaveMsg('Saved to your profile!');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [token, optimizeResult, latexCode, jobDescription, resumeName]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') setLatexCode(text);
    };
    reader.readAsText(file);
  }, []);

  if (!isLoggedIn) return <LandingPage />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              ATS Resume Optimizer
            </h1>
            <p className="text-sm text-zinc-500">Free tool to tailor your LaTeX resume for any job</p>
          </div>
          <div className="flex items-center gap-3">
            {step !== 'input' && (
              <button
                onClick={handleReset}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Start Over
              </button>
            )}
            <a
              href="/dashboard"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              My Resumes
            </a>
            <div className="flex items-center gap-2">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || ''}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:inline">
                {user?.name?.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* LaTeX Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Your Resume (LaTeX)
                  </label>
                  <label className="cursor-pointer rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">
                    Upload .tex
                    <input
                      type="file"
                      accept=".tex,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <LatexEditor value={latexCode} onChange={setLatexCode} height="500px" />
              </div>

              {/* JD Input */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="h-[500px] w-full resize-none rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder-zinc-600"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analysis Results */}
        {step === 'analyzed' && analysisResult && (
          <div className="space-y-8">
            {/* Scores */}
            <div className="grid gap-4 sm:grid-cols-3">
              <ScoreCard label="Overall ATS Score" score={analysisResult.score.overall} />
              <ScoreCard label="Keyword Match" score={analysisResult.score.keywordMatch} />
              <ScoreCard label="Skills Coverage" score={analysisResult.score.skillsCoverage} />
            </div>

            {/* JD Info */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {analysisResult.parsedJD.jobTitle}
              </h3>
              {analysisResult.parsedJD.experienceYears && (
                <p className="mb-4 text-sm text-zinc-500">
                  {analysisResult.parsedJD.experienceYears}+ years experience required
                </p>
              )}
              <div className="space-y-4">
                <KeywordBadges title="Matched Keywords" keywords={analysisResult.score.matchedKeywords} variant="matched" />
                <KeywordBadges title="Missing Keywords" keywords={analysisResult.score.missingKeywords} variant="missing" />
              </div>
            </div>

            {/* Suggestions */}
            <SuggestionsList suggestions={analysisResult.score.suggestions} />

            {/* Resume Info */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Resume Breakdown
              </h3>
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-zinc-500">Sections Found</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {analysisResult.resumeInfo.sectionsFound.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Skills Extracted</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {analysisResult.resumeInfo.skillsExtracted.length} skills
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Bullet Points</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {analysisResult.resumeInfo.bulletPointCount} items
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Optimizing with AI...' : 'Optimize Resume'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optimized Result */}
        {step === 'optimized' && optimizeResult && (
          <div className="space-y-8">
            {/* Score Comparison */}
            <div className="grid gap-4 sm:grid-cols-3">
              <ScoreCard label="Original Score" score={optimizeResult.originalScore} subtitle="Before optimization" />
              <ScoreCard label="Optimized Score" score={optimizeResult.optimizedScore} subtitle="After optimization" />
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className={`text-3xl font-bold ${optimizeResult.improvement > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                  +{optimizeResult.improvement}%
                </span>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Improvement</p>
              </div>
            </div>

            {/* Keyword Changes */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-3 text-sm font-semibold text-zinc-500">Before</h3>
                <KeywordBadges title="Matched" keywords={optimizeResult.details.before.matchedKeywords} variant="matched" />
                <div className="mt-3">
                  <KeywordBadges title="Missing" keywords={optimizeResult.details.before.missingKeywords} variant="missing" />
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-3 text-sm font-semibold text-zinc-500">After</h3>
                <KeywordBadges title="Matched" keywords={optimizeResult.details.after.matchedKeywords} variant="matched" />
                <div className="mt-3">
                  <KeywordBadges title="Missing" keywords={optimizeResult.details.after.missingKeywords} variant="missing" />
                </div>
              </div>
            </div>

            {/* Toggle Diff / Editor */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDiff(false)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${!showDiff ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                >
                  Optimized Code
                </button>
                <button
                  onClick={() => setShowDiff(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${showDiff ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
                >
                  View Diff
                </button>
              </div>

              {showDiff ? (
                <LatexDiffViewer original={latexCode} optimized={optimizeResult.optimizedLatex} />
              ) : (
                <LatexEditor value={optimizeResult.optimizedLatex} onChange={() => {}} readOnly height="500px" />
              )}
            </div>

            {/* Download & Save Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-md">
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  File / Resume Name
                </label>
                <input
                  type="text"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="e.g. Google-SWE-Resume (optional)"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
                />
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleDownloadTex(optimizeResult.optimizedLatex)}
                  className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Download .tex
                </button>
                <button
                  onClick={() => handleDownloadPdf(optimizeResult.optimizedLatex)}
                  disabled={compiling}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {compiling ? 'Compiling PDF...' : 'Download PDF'}
                </button>
                {isLoggedIn && (
                  <button
                    onClick={handleSaveResume}
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save to Profile'}
                  </button>
                )}
              </div>
              {saveMsg && (
                <p className={`text-sm font-medium ${saveMsg.includes('Saved') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Free & Open Source ATS Resume Optimizer — Your data stays in your browser
      </footer>
    </div>
  );
}
