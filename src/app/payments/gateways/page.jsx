'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '../../../lib/api';
import { CreditCard, AlertTriangle, Power } from 'lucide-react';

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState([]);
  const [codEnabled, setCodEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  async function loadGateways() {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/payments/gateways');
      if (res.success && res.data) {
        setGateways(res.data.gateways || []);
        setCodEnabled(Boolean(res.data.cod_enabled));
      }
    } catch (err) {
      console.error('Failed to load gateways:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGateways();
  }, []);

  const handleToggleGateway = async (keyName, currentStatus) => {
    try {
      const res = await adminApi.put(`/admin/payments/gateways/${keyName}/toggle`, {
        is_active: !currentStatus
      });
      if (res.success) {
        loadGateways();
      } else {
        alert(res.message || 'Toggle gateway failed');
      }
    } catch (err) {
      alert(err.message || 'Error toggling gateway');
    }
  };

  const handleToggleCod = async () => {
    try {
      const res = await adminApi.put('/admin/payments/cod/toggle', {
        enabled: !codEnabled
      });
      if (res.success) {
        setCodEnabled(!codEnabled);
      } else {
        alert(res.message || 'COD toggle failed');
      }
    } catch (err) {
      alert(err.message || 'Error toggling COD');
    }
  };

  const activeGatewayCount = gateways.filter((g) => g.is_active).length;
  const isAllDisabled = !codEnabled && activeGatewayCount === 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Payment Gateway Management</h1>
        <p className="text-xs text-gray-500">Configure online payment gateways and Cash On Delivery (COD) settings</p>
      </div>

      {isAllDisabled && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={24} className="text-red-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-sm">Warning: All Checkout Payment Methods Are Disabled!</span>
            Customers will be blocked from completing checkout until at least one payment method or COD is re-enabled.
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Loading payment gateways registry...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* COD Gateway Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Cash On Delivery (COD)</h4>
                  <p className="text-xs text-gray-400">Pay upon delivery</p>
                </div>
              </div>
              <button
                onClick={handleToggleCod}
                className={`p-2.5 rounded-xl transition ${codEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                title={codEnabled ? 'Disable COD' : 'Enable COD'}
              >
                <Power size={18} />
              </button>
            </div>
            <div className="text-xs font-semibold text-gray-500 border-t pt-3 flex justify-between items-center">
              <span>Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${codEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {codEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Dynamic Registry Gateway Cards (Razorpay, Stripe, etc.) */}
          {gateways.map((gw) => (
            <div key={gw.key_name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-100 text-sky-600 rounded-xl">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{gw.display_name || gw.key_name}</h4>
                    <p className="text-xs text-gray-400 font-mono">Key: {gw.key_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleGateway(gw.key_name, gw.is_active)}
                  className={`p-2.5 rounded-xl transition ${gw.is_active ? 'bg-sky-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  title={gw.is_active ? `Disable ${gw.display_name}` : `Enable ${gw.display_name}`}
                >
                  <Power size={18} />
                </button>
              </div>
              <div className="text-xs font-semibold text-gray-500 border-t pt-3 flex justify-between items-center">
                <span>Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${gw.is_active ? 'bg-sky-100 text-sky-800' : 'bg-red-100 text-red-800'}`}>
                  {gw.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
