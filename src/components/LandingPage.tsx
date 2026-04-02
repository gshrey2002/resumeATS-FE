'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useInView } from '@/hooks/useInView';
import { useAuth } from '@/context/AuthContext';

const TYPEWRITER_PHRASES = [
  'Beat the ATS.',
  'Land more interviews.',
  'AI-powered optimization.',
  'Tailored for every job.',
];

function useTypewriter(phrases: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
        } else {
          setCharIdx(charIdx + 1);
        }
      } else {
        setText(current.slice(0, charIdx));
        if (charIdx === 0) {
          setDeleting(false);
          setPhraseIdx((phraseIdx + 1) % phrases.length);
        } else {
          setCharIdx(charIdx - 1);
        }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return text;
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, inView } = useInView(0.3);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(interval); }
      else setCount(start);
    }, 30);
    return () => clearInterval(interval);
  }, [inView, target]);

  return (
    <span ref={ref} className="text-4xl font-extrabold text-white sm:text-5xl">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function LandingPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const typedText = useTypewriter(TYPEWRITER_PHRASES);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = useCallback((credential: string) => {
    login(credential).catch(() => setError('Login failed. Please try again.'));
  }, [login]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {error && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-800 bg-red-950 px-6 py-3 text-sm text-red-300 shadow-lg">
          {error}
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20" />
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-indigo-500/10 blur-3xl" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative mx-auto flex min-h-[90vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-1.5 text-sm text-zinc-400 backdrop-blur-sm">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Powered by AI
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
            ATS Resume
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Optimizer
            </span>
          </h1>

          <div className="mb-8 h-10 text-xl font-medium text-zinc-300 sm:text-2xl">
            {typedText}
            <span className="animate-blink ml-0.5 inline-block w-0.5 bg-blue-400" style={{ height: '1.2em', animation: 'blink 1s step-end infinite' }} />
          </div>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Paste your LaTeX resume, add a job description, and let AI rewrite it to
            maximize your ATS score. Get keyword analysis, smart suggestions, and a
            print-ready PDF in seconds.
          </p>

          <div className="flex flex-col items-center gap-4">
            {mounted ? (
              <div className="rounded-2xl bg-white/10 p-1 shadow-lg shadow-blue-500/20 backdrop-blur-sm transition hover:shadow-blue-500/30">
                <GoogleLogin
                  onSuccess={(resp) => { if (resp.credential) handleLogin(resp.credential); }}
                  onError={() => setError('Google login failed')}
                  size="large"
                  shape="pill"
                  text="continue_with"
                  theme="filled_blue"
                  width="300"
                />
              </div>
            ) : (
              <div className="h-12 w-[300px] animate-pulse rounded-full bg-zinc-800" />
            )}
            <p className="text-xs text-zinc-500">Sign in with Google to get started.</p>
          </div>

          {/* Floating mockup */}
          <div className="mt-16 w-full max-w-3xl">
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-sm" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <div className="mb-3 flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <div className="space-y-2 font-mono text-xs leading-relaxed text-zinc-400 sm:text-sm">
                <p><span className="text-blue-400">\documentclass</span>[letterpaper,11pt]&#123;article&#125;</p>
                <p><span className="text-blue-400">\section</span>&#123;<span className="text-emerald-400">Professional Summary</span>&#125;</p>
                <p className="text-zinc-300">Results-driven software engineer with <span className="rounded bg-emerald-500/20 px-1 text-emerald-300">5+ years</span> of experience...</p>
                <p><span className="text-blue-400">\section</span>&#123;<span className="text-emerald-400">Skills</span>&#125;</p>
                <p className="text-zinc-300">
                  <span className="rounded bg-blue-500/20 px-1 text-blue-300">React</span>,{' '}
                  <span className="rounded bg-blue-500/20 px-1 text-blue-300">TypeScript</span>,{' '}
                  <span className="rounded bg-blue-500/20 px-1 text-blue-300">Node.js</span>,{' '}
                  <span className="rounded bg-yellow-500/20 px-1 text-yellow-300">+12 matched</span>
                </p>
              </div>
              <div className="absolute -right-3 -top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                95% ATS Score
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-zinc-800 bg-zinc-900/50 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 text-center sm:grid-cols-3">
          <AnimatedSection>
            <CountUp target={10000} suffix="+" />
            <p className="mt-2 text-sm font-medium text-zinc-400">Resumes Optimized</p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <CountUp target={95} suffix="%" />
            <p className="mt-2 text-sm font-medium text-zinc-400">Average ATS Pass Rate</p>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <CountUp target={50} suffix="+" />
            <p className="mt-2 text-sm font-medium text-zinc-400">Industries Supported</p>
          </AnimatedSection>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mb-16 text-center text-zinc-400">Three simple steps to a perfectly tailored resume</p>
          </AnimatedSection>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', icon: '{ }', title: 'Paste Your LaTeX Resume', desc: 'Upload or paste your existing LaTeX resume code. We parse every section, skill, and bullet point.' },
              { step: '02', icon: '\u{1F4CB}', title: 'Add the Job Description', desc: 'Paste the full job posting. Our AI extracts keywords, skills, and requirements from any domain.' },
              { step: '03', icon: '\u{2728}', title: 'Get AI-Optimized Results', desc: 'Receive a rewritten resume with maximized keyword matches, ATS scoring, and a downloadable PDF.' },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 150}>
                <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-lg hover:shadow-blue-500/5">
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-blue-400">Step {item.step}</span>
                  <h3 className="mb-3 text-lg font-bold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">Powerful Features</h2>
            <p className="mb-16 text-center text-zinc-400">Everything you need to land your dream job</p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: '\u{1F3AF}', title: 'Smart ATS Scoring', desc: 'Real-time keyword match analysis against the job description. See exactly what\'s missing and what\'s matched.' },
              { icon: '\u{1F916}', title: 'AI-Powered Rewriting', desc: 'Our proprietary ResumeAI engine analyzes context, tone, and industry standards to craft perfectly tailored bullet points that pass both ATS filters and human reviewers.' },
              { icon: '\u{1F4C4}', title: 'Instant PDF Download', desc: 'LaTeX compilation to print-ready PDF. Professional formatting preserved, ready to submit.' },
              { icon: '\u{1F4BE}', title: 'Save & Manage Resumes', desc: 'Save multiple versions for different companies. Load, rename, and manage from your personal dashboard.' },
            ].map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 100}>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50">
                  <div className="mb-4 text-3xl">{f.icon}</div>
                  <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <AnimatedSection>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Ready to land your dream job?
            </h2>
            <p className="mb-10 text-lg text-zinc-400">
              Join thousands of job seekers who optimized their resumes with AI.
              Get started for free today.
            </p>
            <div className="flex justify-center">
              {mounted ? (
                <div className="rounded-2xl bg-white/10 p-1 shadow-lg shadow-blue-500/20 backdrop-blur-sm transition hover:shadow-blue-500/30">
                  <GoogleLogin
                    onSuccess={(resp) => { if (resp.credential) handleLogin(resp.credential); }}
                    onError={() => setError('Google login failed')}
                    size="large"
                    shape="pill"
                    text="continue_with"
                    theme="filled_blue"
                    width="300"
                  />
                </div>
              ) : (
                <div className="h-12 w-[300px] animate-pulse rounded-full bg-zinc-800" />
              )}
            </div>
            <p className="mt-6 text-xs text-zinc-600">
              Your data is secure. We never share your resume.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        ATS Resume Optimizer &mdash; AI-Powered Resume Tailoring
      </footer>

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
