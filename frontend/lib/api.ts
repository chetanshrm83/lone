const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fg_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as any).message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<any>('/auth/me'),
  dashboard: () => request<any>('/users/dashboard'),
  updateProfile: (data: any) => request<any>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getLoans: () => request<any>('/loans'),
  getLoanPriority: () => request<any>('/loans/priority'),
  createLoan: (data: any) => request<any>('/loans', { method: 'POST', body: JSON.stringify(data) }),
  updateLoan: (id: string, data: any) => request<any>(`/loans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLoan: (id: string) => request<any>(`/loans/${id}`, { method: 'DELETE' }),
  getTransactions: (limit = 50) => request<any>(`/transactions?limit=${limit}`),
  addTransaction: (data: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getMonthlyCashflow: () => request<any>('/transactions/monthly'),
  getCategoryBreakdown: () => request<any>('/transactions/categories'),
  getInvestments: () => request<any>('/investments'),
  addInvestment: (data: any) => request<any>('/investments', { method: 'POST', body: JSON.stringify(data) }),
  deleteInvestment: (id: string) => request<any>(`/investments/${id}`, { method: 'DELETE' }),
  calculateInvestment: (monthly: number, rate: number, months: number) =>
    request<any>(`/investments/calculate?monthly=${monthly}&rate=${rate}&months=${months}`),
  getStressScore: () => request<any>('/ai/stress-score'),
  getDecision: () => request<any>('/ai/decision'),
  chatMessage: (data: { message: string; conversationId?: string }) =>
    request<any>('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
  getConversations: () => request<any>('/ai/conversations'),
  getMessages: (convId: string) => request<any>(`/ai/conversations/${convId}/messages`),
  generateScript: (data: any) => request<any>('/communication/generate', { method: 'POST', body: JSON.stringify(data) }),
  logCommunication: (data: any) => request<any>('/communication/log', { method: 'POST', body: JSON.stringify(data) }),
  getCommunicationLogs: () => request<any>('/communication/logs'),
  calculateTax: (data: any) => request<any>('/tax/calculate', { method: 'POST', body: JSON.stringify(data) }),
};
