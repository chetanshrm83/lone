'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const TONE_INFO = {
  POLITE: { label: 'Polite', desc: 'Respectful, cooperative, good-faith approach', color: 'emerald', icon: '🤝' },
  FIRM: { label: 'Firm', desc: 'Assert your rights, request written communication only', color: 'amber', icon: '✊' },
  LEGAL_AWARE: { label: 'Legal-Aware', desc: 'Formal, references your legal rights under consumer protection law', color: 'red', icon: '⚖️' },
};

export default function ProtectionPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [script, setScript] = useState('');
  const [logId, setLogId] = useState('');
  const [form, setForm] = useState({ type: 'CALL', source: '', tone: 'POLITE', context: '' });
  const [loading, setLoading] = useState(false);
  const [logForm, setLogForm] = useState({ type: 'CALL', source: '', content: '', isIncoming: true });
  const [showLogForm, setShowLogForm] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => { api.getCommunicationLogs().then(setLogs as any).catch(console.error); }, []);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setScript('');
    try {
      const res: any = await api.generateScript(form);
      setScript(res.script); setLogId(res.logId);
      api.getCommunicationLogs().then(setLogs as any);
    } catch (e: any) {
      setScript('Error generating script. Please try again.');
    } finally { setLoading(false); }
  };

  const copyScript = () => { navigator.clipboard.writeText(script); setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); };

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.logCommunication(logForm);
    setShowLogForm(false); setLogForm({ type: 'CALL', source: '', content: '', isIncoming: true });
    api.getCommunicationLogs().then(setLogs as any);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Collection Protection Center</h1>
        <p className="text-slate-500 text-sm">Generate legal-safe scripts and log all collection communications</p>
      </div>

      <div className="card border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm text-amber-200/80">
            <strong className="text-amber-400">Important Disclaimer:</strong> These scripts are communication aids to help you respond professionally. They do not constitute legal advice. FinGuardian does not impersonate users, auto-handle calls, or take any automated action on your behalf. Consult a lawyer for serious legal disputes.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script generator */}
        <div className="card card-glow p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🎙️ Script Generator</h3>
          <form onSubmit={generate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Communication Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="CALL">📞 Call Script</option>
                  <option value="EMAIL">✉️ Email Reply</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Creditor / Source</label>
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="HDFC Recovery Team" required className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TONE_INFO).map(([key, info]) => {
                  const borderMap: Record<string, string> = { emerald: 'border-emerald-500', amber: 'border-amber-500', red: 'border-red-500' };
                  const bgMap: Record<string, string> = { emerald: 'bg-emerald-500/10', amber: 'bg-amber-500/10', red: 'bg-red-500/10' };
                  const selected = form.tone === key;
                  return (
                    <button key={key} type="button" onClick={() => setForm({ ...form, tone: key })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${selected ? `${borderMap[info.color]} ${bgMap[info.color]}` : 'border-[#1e2130] hover:border-slate-500'}`}>
                      <div className="text-base mb-0.5">{info.icon}</div>
                      <div className="text-xs font-medium text-white">{info.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-tight">{info.desc.slice(0, 35)}...</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Additional Context (optional)</label>
              <textarea value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="e.g. Caller was aggressive, demanded payment within 24 hours..." rows={2} className="w-full bg-[#0a0b0f] border border-[#1e2130] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>

            <button type="submit" disabled={loading || !form.source} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              {loading ? 'Generating script...' : 'Generate Script'}
            </button>
          </form>

          {script && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-white">Generated Script</div>
                <button onClick={copyScript} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {copiedScript ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-[#0a0b0f] border border-[#1e2130] rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                {script}
              </div>
            </div>
          )}
        </div>

        {/* Communication logs */}
        <div className="card card-glow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">📋 Communication Log</h3>
            <button onClick={() => setShowLogForm(!showLogForm)} className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg transition-colors">
              + Log Event
            </button>
          </div>

          {showLogForm && (
            <form onSubmit={addLog} className="space-y-3 mb-4 p-3 bg-[#0a0b0f] rounded-xl border border-[#1e2130]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select value={logForm.type} onChange={(e) => setLogForm({ ...logForm, type: e.target.value })} className="w-full bg-[#12141a] border border-[#1e2130] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500">
                    <option value="CALL">Call</option><option value="EMAIL">Email</option><option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Source</label>
                  <input value={logForm.source} onChange={(e) => setLogForm({ ...logForm, source: e.target.value })} placeholder="HDFC Recovery" required className="w-full bg-[#12141a] border border-[#1e2130] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes</label>
                <textarea value={logForm.content} onChange={(e) => setLogForm({ ...logForm, content: e.target.value })} placeholder="What happened during this communication?" rows={2} required className="w-full bg-[#12141a] border border-[#1e2130] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={logForm.isIncoming} onChange={(e) => setLogForm({ ...logForm, isIncoming: e.target.checked })} className="rounded" />
                  Incoming
                </label>
                <button type="submit" className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg ml-auto">Save</button>
              </div>
            </form>
          )}

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-slate-600 text-sm py-8">No communications logged yet</div>
            ) : logs.map((log) => (
              <div key={log.id} className="border border-[#1e2130] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{log.type === 'CALL' ? '📞' : log.type === 'EMAIL' ? '✉️' : '💬'}</span>
                    <span className="text-xs font-medium text-white">{log.source}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.isIncoming ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{log.isIncoming ? 'Received' : 'Sent'}</span>
                  </div>
                  <span className="text-xs text-slate-600">{formatDate(log.createdAt)}</span>
                </div>
                <div className="text-xs text-slate-400 line-clamp-2">{log.content}</div>
                {log.tone && <div className="text-xs text-indigo-400/60 mt-1">Tone: {log.tone}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
