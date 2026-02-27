'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12 text-center">
          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 relative flex items-center justify-center">
              <Image
                src="/Tansi.png"
                alt="Tansi Motor Logo"
                width={200}
                height={200}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dashboard Access</h1>
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-1.5 opacity-80">Reserved for hiring team</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
                className={`w-full px-6 py-4 pr-14 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-center placeholder:text-slate-400 text-slate-900 tracking-widest`}
                autoFocus
              />
              {/* Show/Hide toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>

              {error && (
                <p className="text-[10px] font-black text-red-600 uppercase mt-3 animate-bounce">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Unlock Dashboard'
              )}
            </button>
          </form>

          <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            © 2026 Tansi Motors Pvt. Ltd.
          </p>
        </div>
      </div>
    </div>
  );
}