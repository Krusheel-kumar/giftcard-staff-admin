import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8081";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  createdAt: string;
  totalRedeemed: number;
}

interface CustomerReward {
  rewardName: string;
  couponCode: string;
  status: string;
  activatedAt: string;
  redeemedAt: string;
  expiresAt: string;
}

export const CustomersTab = ({ token }: { token: string }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedMobile, setSelectedMobile] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerReward[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/customers?page=${page}&size=20&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setCustomers(data.content || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (mobile: string) => {
    setSelectedMobile(mobile);
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/api/admin/customers/${mobile}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API}/api/admin/customers/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customers.csv";
      a.click();
    } catch (e) {
      alert("Failed to export CSV");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <input 
          type="text" 
          placeholder="Search mobile..." 
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="border border-gray-200 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Name</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Redeemed</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No customers found</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-gray-600 font-mono">{c.mobile}</td>
                  <td className="p-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-bold">{c.totalRedeemed || 0}</td>
                  <td className="p-4">
                    <button onClick={() => fetchHistory(c.mobile)} className="text-blue-600 hover:underline text-sm font-bold">
                      View History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 text-sm font-bold">Previous</button>
        <span className="text-sm font-bold text-gray-500">Page {page + 1}</span>
        <button disabled={customers.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 text-sm font-bold">Next</button>
      </div>

      {/* Modal for History */}
      {selectedMobile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Audit History: <span className="font-mono text-gold">{selectedMobile}</span></h2>
              <button onClick={() => setSelectedMobile(null)} className="text-gray-400 hover:text-black">Close</button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              {loadingHistory ? <p className="text-center">Loading audit log...</p> : (
                <div className="space-y-4">
                  {history.length === 0 ? <p className="text-gray-500 text-center">No rewards found.</p> : history.map((h, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{h.rewardName}</h3>
                          <p className="font-mono text-sm text-gray-500">{h.couponCode}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase ${h.status === "REDEEMED" ? "bg-gray-200 text-gray-600" : h.status === "PENDING_UNLOCK" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {h.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        {h.activatedAt && <p>Activated: {new Date(h.activatedAt).toLocaleString()}</p>}
                        {h.redeemedAt && <p className="font-bold text-red-600">Redeemed: {new Date(h.redeemedAt).toLocaleString()}</p>}
                        {h.expiresAt && !h.redeemedAt && <p>Expires: {new Date(h.expiresAt).toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
