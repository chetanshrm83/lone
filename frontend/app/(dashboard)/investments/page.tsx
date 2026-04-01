'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const INV_TYPES = ['SIP', 'FD', 'PPF', 'ELSS', 'NSC', 'RD', 'GOLD', 'OTHER'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [calc, setCalc] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'SIP', monthlyAmount: '5000', expectedReturn: '12', duration: '60' });
  const [calcInput, setCalcInput] = useState({ monthly: '5000', rate: '12', months: '60' });

  const load = () => api.getInvestments().then(setInvestments as any).catch(console.error);

  useEffect(() => { load().finally(() => setLoading(false)); calculate(); }, []);

  const calculate = async () => {
    setCalcLoading(true);
    try {
      const r = await api.calculateInvestment(+calcInput.monthly, +calcInput.rate, +calcInput.months);
      setCalc(r);
    } catch (e) { console.error(e); } finally { setCalcLoading(false); }
  };

  const addInv = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addInvestment({ ...form, monthlyAmount: +form.monthlyAmount, expectedReturn: +form.expectedReturn, duration: +form.duration });
    setShowForm(false); load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500 animate-pulse">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Investment Engine</h1><p className="text-slate-500 text-sm">SIP projections, FD comparison, Govt scheme analysis</p></div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">+ Add Investment</button>
      </div>

      {showForm && (
        <div className="card card-glow p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Add Investment</h3>
          <form onSubmit={addInv} className="grid grid-cols-2 gap-4">
            {[{ k: 'name', l: 'Name', p: 'Mirae Asset SIP', t: 'text' }, { k: 'monthlyAmount', l: 'Monthly Amount (₹)', p: '5000', t: 'number' }, { k: 'expectedReturn', l: 'Expected Return (%)', p: '12', t: 'number' }, { k: 'duration', l: 'Duration (months)', p: '60', t: 'number' }].map((f) => (
              <div key={f.k}><label className="block text-xs text-slate-400 mb-1">{f.l}</label><input type={f.t} step="any" placeholder={f.p} value={(form as any)[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" /></div>
            ))}
            <div><label className="block text-xs text-slate-400 mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm">{INV_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="col-span-2 flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button><button type="submit" className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg">Save</button></div>
          </form>
        </div>
      )}

      {/* Active investments */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {investments.map((inv) => (
            <div key={inv.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div><div className="font-semibold text-white text-sm">{inv.name}</div><div className="text-xs text-slate-500">{inv.type}</div></div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{inv.expectedReturn}% p.a.</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0a0b0f] rounded-lg p-2"><div className="text-slate-500">Monthly</div><div className="text-white font-medium">{formatCurrency(inv.monthlyAmount)}</div></div>
                <div className="bg-[#0a0b0f] rounded-lg p-2"><div className="text-slate-500">Duration</div><div className="text-white font-medium">{inv.duration}m</div></div>
                {inv.maturityAmount && <div className="col-span-2 bg-emerald-500/10 rounded-lg p-2"><div className="text-slate-500">Est. Maturity</div><div className="text-emerald-400 font-semibold">{formatCurrency(inv.maturityAmount)}</div></div>}
              </div>
              <button onClick={() => api.deleteInvestment(inv.id).then(load)} className="mt-3 text-xs text-red-400/60 hover:text-red-400 transition-colors">Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* Calculator */}
      <div className="card card-glow p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">📊 Investment Calculator</h3>
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">Educational estimates only</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[{ k: 'monthly', l: 'Monthly (₹)', p: '5000' }, { k: 'rate', l: 'Return (%)', p: '12' }, { k: 'months', l: 'Duration (months)', p: '60' }].map((f) => (
            <div key={f.k}><label className="block text-xs text-slate-400 mb-1">{f.l}</label><input type="number" step="any" placeholder={f.p} value={(calcInput as any)[f.k]} onChange={(e) => setCalcInput({ ...calcInput, [f.k]: e.target.value })} className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" /></div>
          ))}
          <div className="col-span-3"><button onClick={calculate} disabled={calcLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">{calcLoading ? 'Calculating...' : 'Calculate'}</button></div>
        </div>

        {calc && !calcLoading && (
          <div className="space-y-4">
            {/* SIP result */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Total Invested', v: formatCurrency(calc.sipProjection.totalInvested), c: 'text-white' },
                { l: 'Estimated Maturity', v: formatCurrency(calc.sipProjection.estimatedMaturity), c: 'text-indigo-400' },
                { l: 'Total Returns', v: formatCurrency(calc.sipProjection.totalReturns), c: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.l} className="bg-[#0a0b0f] rounded-xl p-3 text-center"><div className={`text-lg font-bold ${s.c}`}>{s.v}</div><div className="text-xs text-slate-500 mt-0.5">{s.l}</div></div>
              ))}
            </div>

            {/* Comparison */}
            <div>
              <div className="text-xs text-slate-500 mb-2">Scheme Comparison</div>
              <div className="space-y-2">
                {calc.comparisons.map((c: any, i: number) => (
                  <div key={c.type} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate-400 shrink-0">{c.type}</div>
                    <div className="flex-1 bg-[#0a0b0f] rounded-full h-5 overflow-hidden">
                      <div className="h-full rounded-full flex items-center px-2 text-xs text-white" style={{ width: `${Math.min(100, (c.maturity / calc.comparisons[0].maturity) * 100)}%`, background: COLORS[i % COLORS.length] }}>
                        {formatCurrency(c.maturity)}
                      </div>
                    </div>
                    <div className="w-12 text-xs text-slate-500 text-right">{c.rate}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth chart */}
            {calc.monthlyGrowth?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Growth Trajectory (SIP)</div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={calc.monthlyGrowth}>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Months', position: 'insideBottom', fill: '#475569', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#12141a', border: '1px solid #1e2130', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} name="Portfolio Value" />
                    <Line type="monotone" dataKey="invested" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Amount Invested" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
