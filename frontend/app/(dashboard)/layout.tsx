'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/loans', label: 'Loans', icon: '🏦' },
  { href: '/advisor', label: 'AI Advisor', icon: '🤖' },
  { href: '/investments', label: 'Investments', icon: '📈' },
  { href: '/protection', label: 'Protection', icon: '🛡️' },
  { href: '/tax', label: 'Tax Helper', icon: '🧾' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fg_token') : null;
    if (!token) router.push('/auth');
  }, [router]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0d0e14] border-r border-[#1e2130] flex flex-col fixed h-full z-20">
        <div className="p-5 border-b border-[#1e2130]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-lg">🛡️</div>
            <div>
              <div className="text-sm font-bold text-white">FinGuardian</div>
              <div className="text-xs text-indigo-400">AI CFO</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1e2130]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
            </div>
          </div>
          <button onClick={() => { clearAuth(); router.push('/auth'); }}
            className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors text-left">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
        <div className="text-center py-4 text-xs text-slate-700 border-t border-[#1e2130] mt-8">
          ⚠️ FinGuardian provides financial guidance, not regulated financial advice. Consult a certified advisor for major decisions.
        </div>
      </main>
    </div>
  );
}
