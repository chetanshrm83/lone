'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const DEDUCTION_FIELDS = [
  { key: 'ppf', label: 'PPF Contribution', section: '80C', max: 150000 },
  { key: 'elss', label: 'ELSS / Tax Saver Mutual Fund', section: '80C', max: 150000 },
  { key: 'lifeInsurance', label: 'Life Insurance Premium', section: '80C', max: 150000 },
  { key: 'homeLoanPrincipal', label: 'Home Loan Principal', section: '80C', max: 150000 },
  { key: 'nsc', label: 'NSC Investment', section: '80C', max: 150000 },
  { key: 'healthInsurance', label: 'Health Insurance (Mediclaim)', section: '80D', max: 50000 },
  { key: 'homeLoanInterest', label: 'Home Loan Interest', section: '24B', max: 200000 },
  { key: 'hra', label: 'HRA Exemption', section: 'HRA', max: null },
  { key: 'nps', label: 'NPS Contribution', section: '80CCD(1B)', max: 50000 },
];

export default function TaxPage() {
  const [income, setIncome] = useState('900000');
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = Object.fromEntries(Object.entries(deductions).map(([k, v]) => [k, +v || 0]));
      const r = await api.calculateTax({ annualIncome: +income, deductions: parsed });
      setResult(r);
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tax Helper</h1>
        <p className="text-slate-500 text-sm">FY 2024-25 tax estimate and deduction suggestions</p>
      </div>

      <div className="card p-4 border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300/80">
        ⚠️ <strong>Disclaimer:</strong> These are educational estimates only. FinGuardian does not file taxes or provide certified tax advice. Consult a CA for accurate tax planning and filing.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card card-glow p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Enter Your Details</h3>
          <form onSubmit={calculate} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Annual Gross Income (₹)</label>
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="900000" required className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-300 mb-3">Tax Deductions (for Old Regime)</div>
              <div className="space-y-2.5">
                {DEDUCTION_FIELDS.map((f) => (
                  <div key={f.key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-slate-300">{f.label}</div>
                      <div className="text-xs text-slate-600">Section {f.section}{f.max ? ` · Max ₹${(f.max / 100000).toFixed(1)}L` : ''}</div>
                    </div>
                    <input type="number" value={deductions[f.key] || ''} onChange={(e) => setDeductions({ ...deductions, [f.key]: e.target.value })} placeholder="0" max={f.max || undefined} className="w-28 bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 text-right" />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Regime comparison */}
              <div className="card card-glow p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Regime Comparison</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`rounded-xl p-4 border ${result.recommendation.betterRegime === 'OLD' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[#1e2130]'}`}>
                    <div className="text-xs text-slate-400 mb-1">Old Regime</div>
                    <div className="text-xl font-bold text-white">{formatCurrency(result.oldRegime.estimatedTax)}</div>
                    <div className="text-xs text-slate-500 mt-1">Taxable: {formatCurrency(result.oldRegime.taxableIncome)}</div>
                    {result.recommendation.betterRegime === 'OLD' && <div className="text-xs text-emerald-400 mt-2 font-medium">✓ Recommended</div>}
                  </div>
                  <div className={`rounded-xl p-4 border ${result.recommendation.betterRegime === 'NEW' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-[#1e2130]'}`}>
                    <div className="text-xs text-slate-400 mb-1">New Regime</div>
                    <div className="text-xl font-bold text-white">{formatCurrency(result.newRegime.estimatedTax)}</div>
                    <div className="text-xs text-slate-500 mt-1">Taxable: {formatCurrency(result.newRegime.taxableIncome)}</div>
                    {result.recommendation.betterRegime === 'NEW' && <div className="text-xs text-emerald-400 mt-2 font-medium">✓ Recommended</div>}
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-300">
                  💡 {result.recommendation.advice}
                </div>
              </div>

              {/* Deduction breakdown */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Your Deductions (Old Regime)</h3>
                <div className="space-y-2">
                  {Object.entries(result.oldRegime.breakdown).map(([k, v]: any) => v > 0 && (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-white">{formatCurrency(v)}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#1e2130] pt-2 flex justify-between text-xs font-medium">
                    <span className="text-slate-300">Total Deductions</span>
                    <span className="text-indigo-400">{formatCurrency(result.oldRegime.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">💡 Tax Saving Opportunities</h3>
                  <div className="space-y-3">
                    {result.suggestions.map((s: any, i: number) => (
                      <div key={i} className="border border-[#1e2130] rounded-lg p-3">
                        <div className="text-xs font-medium text-white mb-1">{s.action}</div>
                        <div className="text-xs text-emerald-400 mb-1">{s.benefit}</div>
                        <div className="text-xs text-slate-500">{s.instruments}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center text-slate-500">
              <div className="text-4xl mb-3">🧾</div>
              <div className="font-medium">Enter your income and deductions</div>
              <div className="text-sm mt-1">Get a tax estimate and saving suggestions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
