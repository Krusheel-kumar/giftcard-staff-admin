import React, { useState } from 'react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8081';

type Screen = 'login' | 'lookup' | 'redeem' | 'success' | 'dashboard';

interface CardInfo {
  status: string;
  mobileNumber: string;
}

interface RedeemResult {
  success: boolean;
}

interface AdminRecord {
  name: string;
  mobileNumber: string;
  code: string;
  status: string;
  generatedAt: string | null;
  redeemedAt: string | null;
}

interface AdminStats {
  totalGenerated: number;
  totalRedeemed: number;
  records: AdminRecord[];
}

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [pin, setPin] = useState('');
  const [code, setCode] = useState('');
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── STAFF AUTH ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      setToken(data.token);
      setScreen('lookup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  // ─── VALIDATE CARD ───
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCardInfo(null);

    try {
      const res = await fetch(`${API}/api/bogo/admin/lookup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        throw new Error(data.message || 'Invalid or already redeemed card');
      }

      setCardInfo({
        status: data.status,
        mobileNumber: data.mobileNumber,
      });
      setScreen('redeem');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── REDEEM ───
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/bogo/redeem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Redemption failed');

      setResult({ success: true });
      setScreen('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/bogo/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setScreen('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode('');
    setCardInfo(null);
    setResult(null);
    setError('');
    setScreen('lookup');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      {/* ─── LOGIN ─── */}
      {screen === 'login' && (
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <p className="text-2xl font-bold text-richBlack">Pop O'Bob</p>
            <p className="text-gray-400 text-sm mt-1">Staff Redemption Portal</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-center mb-6">Enter Staff PIN</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                placeholder="Enter password..."
                className="w-full text-center text-2xl tracking-widest px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none"
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-richBlack text-cream font-bold py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── CARD LOOKUP ─── */}
      {screen === 'lookup' && (
        <div className="max-w-sm w-full">
          <div className="bg-richBlack text-cream rounded-t-2xl p-5 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">BOGO Redemption</h1>
              <p className="text-gray-400 text-sm mt-1">Enter the customer's card code</p>
            </div>
            <button 
              onClick={handleOpenDashboard} 
              className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-cream px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              Dashboard
            </button>
          </div>
          <div className="bg-white rounded-b-2xl shadow-md border border-t-0 border-gray-100 p-6">
            <form onSubmit={handleLookup} className="space-y-4">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="POB-XXXX-XXXX"
                className="w-full text-center font-mono text-lg tracking-widest px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none uppercase"
              />
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading || code.length < 3}
                className="w-full bg-gold text-richBlack font-bold py-4 rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50">
                {loading ? 'Checking...' : 'Check Card →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── REDEEM ─── */}
      {screen === 'redeem' && cardInfo && (
        <div className="max-w-sm w-full">
          <div className="bg-richBlack text-cream rounded-t-2xl p-5">
            <h1 className="text-xl font-bold">Card Valid ✅</h1>
            <p className="text-sm text-gray-400 font-mono mt-1">{code}</p>
          </div>
          <div className="bg-white rounded-b-2xl shadow-md border border-t-0 border-gray-100 p-6 space-y-5">
            {/* Balance display */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Offer Available</p>
              <p className="text-3xl font-bold text-green-700">Buy 1 Get 1 Free</p>
              {cardInfo.mobileNumber && (
                <p className="text-sm text-gray-500 mt-2">Mobile: +91 {cardInfo.mobileNumber}</p>
              )}
            </div>

            {/* Action */}
            <form onSubmit={handleRedeem} className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-richBlack text-cream font-bold py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 text-lg">
                {loading ? 'Processing...' : `Mark as Redeemed`}
              </button>
              <button type="button" onClick={() => { setScreen('lookup'); setError(''); }}
                className="w-full text-gray-400 text-sm hover:text-black transition-colors mt-2">
                ← Back
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUCCESS ─── */}
      {screen === 'success' && result && (
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✅
            </div>
            <div>
              <h2 className="text-xl font-bold text-richBlack">Redeemed Successfully!</h2>
              <p className="text-gray-500 text-sm mt-1">This code has been marked as used.</p>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <p className="text-xl font-bold text-red-600">USED</p>
              </div>
            </div>

            <button onClick={reset}
              className="w-full bg-richBlack text-cream font-bold py-4 rounded-xl hover:bg-black transition-all">
              Redeem Another Card
            </button>
          </div>
        </div>
      )}

      {/* ─── DASHBOARD ─── */}
      {screen === 'dashboard' && stats && (
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-richBlack">Admin Dashboard</h1>
              <p className="text-gray-500">Live Campaign Statistics</p>
            </div>
            <button onClick={reset} className="px-4 py-2 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition">
              Back to Scanner
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
              <p className="text-gray-500 font-bold mb-1">Generated</p>
              <p className="text-4xl font-black text-richBlack">{stats.totalGenerated}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
              <p className="text-gray-500 font-bold mb-1">Redeemed</p>
              <p className="text-4xl font-black text-green-600">{stats.totalRedeemed}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Generated</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Redeemed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.records.map((r, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-medium">{r.name}</td>
                      <td className="p-4 text-gray-600">{r.mobileNumber}</td>
                      <td className="p-4 font-mono font-medium">{r.code}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {r.generatedAt ? new Date(r.generatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${r.status === 'REDEEMED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                  {stats.records.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
