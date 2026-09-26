'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SmsSettingsPage() {
  const [form, setForm] = useState({ provider: 'fast2sms', api_key: '', sender_id: '', entity_id: '' });
  const [balance, setBalance] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    async function loadSms() {
      try {
        const res = await api.get('/admin/settings');
        if (res.success && res.data) {
          setForm({
            provider: res.data.sms_provider || 'fast2sms',
            api_key: res.data.sms_api_key || '',
            sender_id: res.data.sms_sender_id || '',
            entity_id: res.data.sms_entity_id || ''
          });
        }
        const balRes = await api.get('/admin/sms/balance');
        if (balRes.success) setBalance(balRes.data?.balance ?? 100);
      } catch (err) {
        console.error(err);
      }
    }
    loadSms();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        sms_provider: form.provider,
        sms_api_key: form.api_key,
        sms_sender_id: form.sender_id,
        sms_entity_id: form.entity_id
      });
      if (res.success) alert('SMS Gateway settings saved!');
    } catch (err) {
      alert(err.message || 'Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) return alert('Enter a mobile number to test');
    setSendingTest(true);
    try {
      const res = await api.post('/admin/sms/test', { phone: testPhone });
      if (res.success) alert('Test SMS dispatched successfully!');
      else alert(res.message || 'SMS send failed');
    } catch (err) {
      alert(err.message || 'Error sending test SMS');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">SMS Gateway & DLT Config</h1>
            <p className="text-slate-500 text-sm">Configure Fast2SMS / Twilio SMS gateway for OTP & order alerts</p>
          </div>
          {balance !== null && (
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-right">
              <p className="text-xs text-emerald-600 font-semibold uppercase">SMS Balance</p>
              <p className="text-lg font-bold text-emerald-800">{balance} Credits</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="fast2sms">Fast2SMS (India)</option>
              <option value="twilio">Twilio</option>
              <option value="msg91">MSG91</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key / Auth Token</label>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sender Header ID</label>
              <input
                type="text"
                placeholder="e.g. VISHAL"
                value={form.sender_id}
                onChange={(e) => setForm({ ...form, sender_id: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">DLT Entity ID</label>
              <input
                type="text"
                value={form.entity_id}
                onChange={(e) => setForm({ ...form, entity_id: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Save Config'}
            </button>
          </div>
        </form>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Test SMS Dispatch</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter 10-digit phone number"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={handleSendTest}
              disabled={sendingTest}
              className="bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium hover:bg-slate-900"
            >
              {sendingTest ? 'Sending...' : 'Send Test SMS'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
