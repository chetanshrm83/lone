'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const QUICK_PROMPTS = [
  'How should I prioritise my loan repayments?',
  'Should I invest while paying off debt?',
  'How can I reduce my monthly EMI burden?',
  'What is my current debt-to-income ratio?',
  'Create a 6-month debt repayment plan for me',
];

function Message({ msg }: { msg: any }) {
  const isUser = msg.role === 'USER' || msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-sm mr-2 mt-0.5 shrink-0">🤖</div>}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-[#1a1d26] text-slate-200 border border-[#1e2130] rounded-bl-sm'}`}>
        {msg.content.split('\n').map((line: string, i: number) => <p key={i} className={line ? 'mb-1 last:mb-0' : 'mb-2'}>{line}</p>)}
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [convId, setConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<any>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getDecision().then(setDecision).catch(console.error).finally(() => setDecisionLoading(false));
    setMessages([{ role: 'ASSISTANT', content: "Hello! I'm your FinGuardian AI advisor. I have your complete financial profile loaded — income, loans, investments, and spending patterns. How can I help you take control of your finances today?" }]);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'USER', content: msg }]);
    setLoading(true);
    try {
      const res: any = await api.chatMessage({ message: msg, conversationId: convId || undefined });
      setConvId(res.conversationId);
      setMessages((prev) => [...prev, { role: 'ASSISTANT', content: res.response }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'ASSISTANT', content: `Error: ${e.message}. Please check your connection and try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Financial Advisor</h1>
        <p className="text-slate-500 text-sm">Powered by GPT + rule-based financial engine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2 card card-glow flex flex-col" style={{ height: '65vh' }}>
          <div className="p-4 border-b border-[#1e2130] flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow" />
            <span className="text-sm font-medium text-white">FinGuardian AI</span>
            <span className="text-xs text-slate-500">Context: income, loans, investments loaded</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-sm mr-2 mt-0.5">🤖</div>
                <div className="bg-[#1a1d26] border border-[#1e2130] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-4 border-t border-[#1e2130]">
            <div className="flex gap-2 mb-3 flex-wrap">
              {QUICK_PROMPTS.slice(0, 3).map((p) => (
                <button key={p} onClick={() => send(p)} className="text-xs bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full hover:bg-indigo-600/20 transition-colors">
                  {p.slice(0, 35)}...
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask anything about your finances..." disabled={loading}
                className="flex-1 bg-[#0a0b0f] border border-[#1e2130] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
              <button onClick={() => send()} disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-medium">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Decision Engine Panel */}
        <div className="space-y-4">
          <div className="card card-glow p-5">
            <h3 className="text-sm font-semibold text-white mb-3">🎯 AI Decision Engine</h3>
            {decisionLoading ? <div className="text-slate-500 text-sm animate-pulse">Analysing...</div> : decision ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(decision.context || {}).map(([k, v]: any) => (
                    <div key={k} className="bg-[#0a0b0f] rounded-lg p-2">
                      <div className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-white font-medium">{typeof v === 'number' ? formatCurrency(v) : v}</div>
                    </div>
                  ))}
                </div>
                {decision.ruleBasedActions?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Rule-Based Insights</div>
                    {decision.ruleBasedActions.map((a: any, i: number) => (
                      <div key={i} className={`text-xs p-2.5 rounded-lg mb-2 border ${a.priority === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-300' : a.priority === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'}`}>
                        {a.action}
                      </div>
                    ))}
                  </div>
                )}
                {decision.cashAllocation?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">Surplus Allocation</div>
                    {decision.cashAllocation.map((a: any) => (
                      <div key={a.label} className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300">{a.label}</span>
                        <span className="text-indigo-400 font-medium">{formatCurrency(a.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {decision.aiSuggestion && (
                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-3">
                    <div className="text-xs text-indigo-400 mb-1">AI Suggestion</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{decision.aiSuggestion}</div>
                  </div>
                )}
              </div>
            ) : <div className="text-slate-500 text-xs">Unable to load decision data</div>}
          </div>

          <div className="card p-4">
            <div className="text-xs text-slate-600 leading-relaxed">
              ⚠️ FinGuardian provides financial guidance, not regulated financial advice. Always consult a certified financial advisor for major financial decisions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
