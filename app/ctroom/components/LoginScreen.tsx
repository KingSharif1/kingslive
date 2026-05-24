'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthService } from '../services/authService';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

type LoginState = 'idle' | 'loading' | 'sent' | 'error';

const BOOT_LINES = [
  { text: '> CTROOM OS v2.0.48-STABLE', delay: 0.3 },
  { text: '> INITIALIZING COMMAND INTERFACE...', delay: 1.1 },
  { text: '> SECURE SOCKET LAYER: ESTABLISHED', delay: 1.9 },
  { text: '> VERIFYING BIOMETRIC HASH...', delay: 2.7 },
  { text: '> LOCATION: ENCRYPTED NODE [TX, US]', delay: 3.5 },
  { text: '> ACCESS STATUS: PENDING_AUTH', delay: 4.3, accent: true },
];

export function LoginScreen() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<LoginState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    setErrorMsg('');
    const result = await AuthService.handleLogin(email.trim());
    if (result.success && result.magicLinkSent) {
      setState('sent');
    } else {
      setState('error');
      setErrorMsg(result.error || 'Something went wrong. Try again.');
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: 'oklch(12% 0 265)', color: '#e5e5e5' }}>
      {/* CRT overlay */}
      <div className="hq-crt" />
      {/* Scanline sweep */}
      {mounted && <div className="hq-scanline" />}

      {/* ── Left: Terminal boot panel (desktop only) ─────────────── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 border-r border-white/5 relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(0,255,136,0.04) 0%, transparent 70%)' }} />

        <div className="relative space-y-1 max-w-sm">
          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">
              System Terminal · Operational
            </span>
          </div>

          {/* Boot sequence lines */}
          {mounted && BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className="hq-type font-mono text-sm leading-relaxed"
              style={{
                animationDelay: `${line.delay}s`,
                color: line.accent ? '#00ff88' : 'rgba(255,255,255,0.65)',
              }}
            >
              {line.text}
            </div>
          ))}

          {/* Blinking cursor */}
          {mounted && (
            <div className="flex items-center gap-1 pt-1" style={{ opacity: 0, animation: `fadeIn 0.1s ${4.9}s forwards` }}>
              <span className="font-mono text-sm text-white/50">{'>'}</span>
              <span className="hq-cursor" />
            </div>
          )}

          {/* Footer metadata */}
          <div className="pt-16 flex justify-between text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <span>Uptime: 4,128h</span>
            <span>Kernel: 6.4.12-LTS</span>
          </div>
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(0,255,136,0.05) 0%, transparent 65%)' }} />

        <motion.div
          className="w-full max-w-sm z-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-500"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              <svg viewBox="0 0 22 18" fill="#00ff88" className="w-7 h-6">
                <path d="M1 15 L4 5.5 L7.5 9.5 L11 1 L14.5 9.5 L18 5.5 L21 15 Z" />
                <rect x="0.5" y="15" width="21" height="2.5" rx="1.25" />
                <circle cx="4" cy="5.5" r="1.4" />
                <circle cx="11" cy="1" r="1.4" />
                <circle cx="18" cy="5.5" r="1.4" />
              </svg>
            </div>
            <h1 className="font-mono text-xl font-bold tracking-tighter text-white uppercase">
              Authenticate
            </h1>
            <p className="font-mono text-[10px] text-white/30 tracking-[0.25em] uppercase mt-1">
              CTROOM HQ ACCESS PORTAL
            </p>
          </div>

          {/* Glass card */}
          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <AnimatePresence mode="wait">
              {state === 'sent' ? (
                <motion.div
                  key="sent"
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)' }}>
                    <Mail className="w-5 h-5" style={{ color: '#00ff88' }} />
                  </div>
                  <h2 className="font-mono font-semibold text-white mb-2 uppercase tracking-wide">Check your email</h2>
                  <p className="text-sm text-white/40 mb-1">Magic link sent. Click it to sign in.</p>
                  <p className="text-xs text-white/25 mb-6">Expires in 1 hour.</p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { setState('idle'); setEmail(''); }}
                      className="text-sm text-white/30 hover:text-white/60 transition-colors underline-offset-4 hover:underline font-mono"
                    >
                      Use a different email
                    </button>
                    <a
                      href="/"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to home
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                      Operator ID / Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      disabled={state === 'loading'}
                      className="w-full px-4 py-3 rounded-lg font-mono text-sm text-white placeholder-white/20 outline-none transition-all disabled:opacity-50"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,136,0.4)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,136,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <AnimatePresence>
                    {state === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <p className="font-mono text-sm text-red-400">{errorMsg}</p>
                        {errorMsg.includes('Access denied') && (
                          <a
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                          >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Back to home
                          </a>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={state === 'loading' || !email.trim()}
                    className="hq-sweep w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-mono text-sm font-bold uppercase tracking-widest transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}
                  >
                    {state === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Send Magic Link'
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom hint */}
          <p className="text-center font-mono text-[10px] text-white/15 mt-6 uppercase tracking-widest">
            Authorized personnel only
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .font-mono { font-family: var(--font-mono), 'JetBrains Mono', monospace; }
      `}</style>
    </div>
  );
}
