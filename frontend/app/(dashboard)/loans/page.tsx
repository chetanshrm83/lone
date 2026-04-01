'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const LOAN_TYPES = ['PERSONAL', 'HOME', 'VEHICLE', 'EDUCATION', 'CREDIT_CARD', 'BUSINESS', 'OTHER'];

function LoanCard({ loan, onDelete }: { loan: any; onDelete: () => void }) {
  const isOverdue = loan.overdueDays > 0;
  const urgencyColor = loan.priorityScore >= 20 ? 'border-red-500/30 bg-red-500/5' : loan.priorityScore >= 12 ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#1e2130]';
  const pct = Math.round((1 - loan.outstandingAmount / loan.totalAmount) * 100);

  return (
    <div className={`card p-5 border ${urgencyColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-white">{loan.loanName}</div>
          {loan.lenderName && <div className="text-xs text-slate-500 mt-0.5">{loan.lenderName}</div>}
        </div>
        <div className="flex items-center gap-2">
          {isOverdue && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">{loan.overdueDays}d overdue</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full border ${loan.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{loan.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-[#0a0b0f] rounded-lg p-2.5">
          <div className="text-xs text-slate-500">Outstanding</div>
          <div className="text-sm font-bold text-white">{formatCurrency(loan.outstandingAmount)}</div>
        </div>
        <div className="bg-[#0a0b0f] rounded-lg p-2.5">
          <div className="text-xs text-slate-500">EMI / Month</div>
          <div className="text-sm font-bold text-indigo-400">{formatCurrency(loan.emiAmount)}</div>
        </div>
        <div className="bg-[#0a0b0f] rounded-lg p-2.5">
          <div className="text-xs text-slate-500">Interest</div>
          <div className="text-sm font-bold text-amber-400">{loan.interestRate}%</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Repaid</span><span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Due: {formatDate(loan.dueDate)}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">Priority Score: <span className={loan.priorityScore >= 20 ? 'text-red-400' : loan.priorityScore >= 12 ? 'text-amber-400' : 'text-emerald-400'}>{loan.priorityScore?.toFixed(1)}</span></div>
          <button onClick={onDelete} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [priority, setPriority] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ loanName: '', lenderName: '', totalAmount: '', outstandingAmount: '', interestRate: '', emiAmount: '', dueDate: '', overdueDays: '0', penaltyRate: '0', loanType: 'PERSONAL' });

  const load = async () => {
    const [l, p] = await Promise.all([api.getLoans(), api.getLoanPriority()]);
    setLoans(l as any[]); setPriority(p);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createLoan({ ...form, totalAmount: +form.totalAmount, outstandingAmount: +form.outstandingAmount, interestRate: +form.interestRate, emiAmount: +form.emiAmount, overdueDays: +form.overdueDays, penaltyRate: +form.penaltyRate });
    setShowForm(false); setForm({ loanName: '', lenderName: '', totalAmount: '', outstandingAmount: '', interestRate: '', emiAmount: '', dueDate: '', overdueDays: '0', penaltyRate: '0', loanType: 'PERSONAL' });
    load();
  };

  const deleteLoan = async (id: string) => { if (confirm('Delete this loan?')) { await api.deleteLoan(id); load(); } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500 animate-pulse">Loading loans...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Loan Management</h1>
          <p className="text-slate-500 text-sm">Track and manage all your debt obligations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Loan
        </button>
      </div>

      {/* Priority recommendation */}
      {priority?.recommendation && (
        <div className="card p-4 border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="text-sm font-semibold text-indigo-400 mb-1">EMI Priority Engine Recommendation</div>
              <div className="text-sm text-slate-300">{priority.recommendation}</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {priority?.summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { l: 'Total Outstanding', v: formatCurrency(priority.summary.totalOutstanding), color: 'text-red-400' },
            { l: 'Monthly EMI Total', v: formatCurrency(priority.summary.totalMonthlyEmi), color: 'text-amber-400' },
            { l: 'Overdue Loans', v: priority.summary.overdueCount, color: priority.summary.overdueCount > 0 ? 'text-red-400' : 'text-emerald-400' },
          ].map((s) => (
            <div key={s.l} className="card p-4 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.v}</div>
              <div className="text-xs text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card card-glow p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Add New Loan</h3>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            {[
              { key: 'loanName', label: 'Loan Name', placeholder: 'HDFC Personal Loan', type: 'text' },
              { key: 'lenderName', label: 'Lender Name', placeholder: 'HDFC Bank', type: 'text' },
              { key: 'totalAmount', label: 'Total Amount (₹)', placeholder: '500000', type: 'number' },
              { key: 'outstandingAmount', label: 'Outstanding (₹)', placeholder: '350000', type: 'number' },
              { key: 'interestRate', label: 'Interest Rate (%)', placeholder: '18.5', type: 'number' },
              { key: 'emiAmount', label: 'EMI Amount (₹)', placeholder: '12000', type: 'number' },
              { key: 'dueDate', label: 'Next Due Date', placeholder: '', type: 'date' },
              { key: 'overdueDays', label: 'Overdue Days', placeholder: '0', type: 'number' },
              { key: 'penaltyRate', label: 'Penalty Rate (%)', placeholder: '0', type: 'number' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                <input type={f.type} step="any" placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Loan Type</label>
              <select value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value })} className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg">Save Loan</button>
            </div>
          </form>
        </div>
      )}

      {/* Loan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loans.length === 0 ? (
          <div className="col-span-2 card p-12 text-center text-slate-500">
            <div className="text-4xl mb-3">🏦</div>
            <div className="font-medium">No loans added yet</div>
            <div className="text-sm mt-1">Add your first loan to start tracking</div>
          </div>
        ) : loans.map((l) => <LoanCard key={l.id} loan={l} onDelete={() => deleteLoan(l.id)} />)}
      </div>
    </div>
  );
}
