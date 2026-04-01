'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', monthlyIncome: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res: any = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.register({ name: form.name, email: form.email, password: form.password, monthlyIncome: +form.monthlyIncome || 0 });
      setAuth(res.user, res.access_token);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
            <span className="text-2xl font-bold text-white">FinGuardian <span className="text-indigo-400">AI</span></span>
          </div>
          <p className="text-slate-400 text-sm">Your AI CFO for Debt, Money & Peace of Mind</p>
        </div>

        <div className="card card-glow p-8">
          <div className="flex bg-[#0a0b0f] rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
                <input className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Arjun Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email Address</label>
              <input type="email" className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="arjun@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input type="password" className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Monthly Income (₹)</label>
                <input type="number" className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="75000" value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} />
              </div>
            )}
            {error && <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-3">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            Demo: <span className="text-indigo-400">arjun@demo.com</span> / <span className="text-indigo-400">Demo@1234</span>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          FinGuardian provides financial guidance, not regulated financial advice.
        </p>
      </div>
    </div>
  );
}
