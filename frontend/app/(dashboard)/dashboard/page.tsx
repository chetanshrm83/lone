'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, getStressColor, getStressBg } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function StatCard({ label, value, sub, icon, color = 'indigo' }: any) {
  const cls: Record<string, string> = { indigo: 'bg-indigo-500/10 text-indigo-400', amber: 'bg-amber-500/10 text-amber-400', emerald: 'bg-emerald-500/10 text-emerald-400', red: 'bg-red-500/10 text-red-400' };
  return (
    <div className="card card-glow p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${cls[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [stress, setStress] = useState<any>(null);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(), api.getStressScore(), api.getMonthlyCashflow(), api.getCategoryBreakdown()])
      .then(([d, s, cf, cat]) => { setData(d); setStress(s); setCashflow(cf as any[]); setCategories((cat as any[]).slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500 animate-pulse">Loading your financial data...</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your complete money picture at a glance</p>
        </div>
        {stress && (
          <div className="card p-4 text-center min-w-[140px]">
            <div className="text-xs text-slate-500 mb-1">AI Stress Score</div>
            <div className={`text-3xl font-bold ${getStressColor(stress.score)}`}>{stress.score}</div>
            <div className={`text-xs font-medium mt-1 ${getStressColor(stress.score)}`}>{stress.label}</div>
            <div className="mt-2 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${getStressBg(stress.score)}`} style={{ width: `${stress.score}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Debt" value={formatCurrency(data.totalDebt)} icon="🏦" sub={`${data.loanCount} loans`} color="red" />
          <StatCard label="Monthly EMI" value={formatCurrency(data.monthlyEmi)} icon="📅" sub="Due this month" color="amber" />
          <StatCard label="Net Balance" value={formatCurrency(data.netBalance)} icon="💰" sub="After EMI & expenses" color={data.netBalance >= 0 ? 'emerald' : 'red'} />
          <StatCard label="Overdue Loans" value={data.overdueCount} icon="⚠️" sub={data.overdueCount > 0 ? 'Needs attention' : 'All clear'} color={data.overdueCount > 0 ? 'red' : 'emerald'} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Cashflow chart */}
        <div className="card card-glow p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Cashflow</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashflow} barGap={4}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#12141a', border: '1px solid #1e2130', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block" />Income</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" />Expenses</span>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="card card-glow p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Expense Breakdown</h3>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="amount" paddingAngle={3}>
                    {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#12141a', border: '1px solid #1e2130', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categories.map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />{c.category}</span>
                    <span className="text-white">₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No expense data yet</div>}
        </div>
      </div>
    </div>
  );
}
