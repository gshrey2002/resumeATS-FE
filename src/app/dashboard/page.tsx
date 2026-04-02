'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listResumes, getResume, deleteResume, updateResume } from '@/lib/api';
import type { SavedResumeSummary } from '@/lib/api';

export default function Dashboard() {
  const { user, token, isLoggedIn, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<SavedResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const fetchResumes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await listResumes(token);
      setResumes(data);
    } catch {
      setError('Failed to load your resumes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchResumes();
  }, [token, fetchResumes]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this resume?')) return;
    setDeleting(id);
    try {
      await deleteResume(token, id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setError('Failed to delete resume');
    } finally {
      setDeleting(null);
    }
  };

  const handleLoad = async (id: string) => {
    if (!token) return;
    try {
      const resume = await getResume(token, id);
      const params = new URLSearchParams();
      params.set('resumeId', resume._id);
      router.push(`/?${params.toString()}`);
      sessionStorage.setItem('loaded_resume', JSON.stringify(resume));
    } catch {
      setError('Failed to load resume');
    }
  };

  const handleRenameStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleRenameSave = async (id: string) => {
    if (!token || !editName.trim()) return;
    try {
      await updateResume(token, id, { name: editName.trim() });
      setResumes((prev) =>
        prev.map((r) => (r._id === id ? { ...r, name: editName.trim() } : r))
      );
    } catch {
      setError('Failed to rename resume');
    } finally {
      setEditingId(null);
      setEditName('');
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') handleRenameSave(id);
    if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || ''}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">My Resumes</h1>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Optimizer
            </a>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-zinc-500">Loading your resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">No saved resumes yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Optimize a resume and click &ldquo;Save to Profile&rdquo; to see it here.
            </p>
            <a
              href="/"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Go to Optimizer
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => (
              <div
                key={r._id}
                className="relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                {editingId === r._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, r._id)}
                      onBlur={() => handleRenameSave(r._id)}
                      autoFocus
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-semibold text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      placeholder="e.g. Google SWE Resume"
                    />
                  </div>
                ) : (
                  <h3
                    className="cursor-pointer truncate text-base font-semibold text-zinc-800 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                    onClick={() => handleRenameStart(r._id, r.name)}
                    title="Click to rename"
                  >
                    {r.name}
                    <span className="ml-1.5 text-xs text-zinc-400">&#9998;</span>
                  </h3>
                )}
                <div className="mt-2 flex items-center gap-3">
                  {r.lastScore !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        r.lastScore >= 80
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                          : r.lastScore >= 60
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {r.lastScore}%
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleLoad(r._id)}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(r._id)}
                    disabled={deleting === r._id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    {deleting === r._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
