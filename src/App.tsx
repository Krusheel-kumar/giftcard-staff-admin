import React, { useState } from 'react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8081';

type Screen = 'login' | 'lookup' | 'redeem' | 'success';

interface CardInfo {
  balance: number;
  status: string;
  recipientName: string;
}

interface RedeemResult {
  redeemedAmount: number;
  remainingBalance: number;
  transactionId: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [pin, setPin] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── STAFF AUTH ───
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // In prod, call a real /api/auth/staff endpoint
      setScreen('lookup');
      setError('');
    } else {
      setError('Invalid PIN. Please try again.');
    }
    setPin('');
  };

  // ─── VALIDATE CARD ───
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCardInfo(null);

    try {
      const res = await fetch(`${API}/api/admin/gift-cards/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        throw new Error(data.message || 'Invalid card');
      }

      setCardInfo({
        balance: data.balance,
        status: data.status,
        recipientName: data.recipientName || 'Customer',
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
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) throw new Error('Enter a valid amount');
      if (amt > (cardInfo?.balance ?? 0)) throw new Error(`Amount exceeds balance of ₹${cardInfo?.balance}`);

      const res = await fetch(`${API}/api/admin/gift-cards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim(), amount: amt, storeId: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Redemption failed');

      setResult({
        redeemedAmount: data.redeemedAmount,
        remainingBalance: data.remainingBalance,
        transactionId: data.transactionId,
      });
      setScreen('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode('');
    setAmount('');
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
                maxLength={6}
                placeholder="● ● ● ●"
                className="w-full text-center text-2xl tracking-widest px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none"
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit"
                className="w-full bg-richBlack text-cream font-bold py-4 rounded-xl hover:bg-black transition-all">
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── CARD LOOKUP ─── */}
      {screen === 'lookup' && (
        <div className="max-w-sm w-full">
          <div className="bg-richBlack text-cream rounded-t-2xl p-5">
            <h1 className="text-xl font-bold">Gift Card Redemption</h1>
            <p className="text-gray-400 text-sm mt-1">Enter the customer's card code</p>
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
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Available Balance</p>
              <p className="text-5xl font-bold text-green-700">₹{Number(cardInfo.balance).toFixed(2)}</p>
              {cardInfo.recipientName && (
                <p className="text-sm text-gray-500 mt-2">For: {cardInfo.recipientName}</p>
              )}
            </div>

            {/* Amount entry */}
            <form onSubmit={handleRedeem} className="space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount to Redeem
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  placeholder="0.00"
                  min="1"
                  max={cardInfo.balance}
                  step="0.01"
                  className="w-full pl-8 pr-4 py-4 text-xl font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold outline-none"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading || !amount}
                className="w-full bg-richBlack text-cream font-bold py-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 text-lg">
                {loading ? 'Processing...' : `Redeem ₹${amount || '0'}`}
              </button>
              <button type="button" onClick={() => { setScreen('lookup'); setError(''); }}
                className="w-full text-gray-400 text-sm hover:text-black transition-colors">
                ← Different Card
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
              <h2 className="text-xl font-bold text-richBlack">Redemption Successful!</h2>
              <p className="text-gray-500 text-sm mt-1">Txn #{result.transactionId}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Redeemed</p>
                <p className="text-3xl font-bold text-red-600">- ₹{Number(result.redeemedAmount).toFixed(2)}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remaining Balance</p>
                <p className="text-3xl font-bold text-green-700">₹{Number(result.remainingBalance).toFixed(2)}</p>
              </div>
            </div>

            <button onClick={reset}
              className="w-full bg-richBlack text-cream font-bold py-4 rounded-xl hover:bg-black transition-all">
              Redeem Another Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
