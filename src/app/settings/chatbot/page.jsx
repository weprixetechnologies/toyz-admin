'use client';

import { useState, useEffect } from 'react';
import { fetchAdminApi } from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Link as LinkIcon,
  ChevronRight,
  RotateCcw,
  Sliders,
  Send,
  Eye
} from 'lucide-react';

const DEFAULT_FLOW_ITEM = () => ({
  id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  label: 'New Option',
  action_type: 'message', // 'message' | 'link' | 'lead_form'
  url: '',
  response_message: 'Thanks for asking! Here is more information.',
  next_options: []
});

export default function ChatbotSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [contactFormConfig, setContactFormConfig] = useState({
    enabled: true,
    title: 'Quick Inquiry / Contact Us',
    subtitle: 'Leave your contact details and requirement. Our team will get back to you shortly.',
    button_tooltip: 'Quick Contact',
    shake_interval_seconds: 6,
    button_color: '#0284c7'
  });

  const [chatbotConfig, setChatbotConfig] = useState({
    enabled: true,
    bot_name: 'Provoke Playtech Assistant',
    bot_subtitle: 'Online • Quick Answers',
    welcome_message: 'Hi there! 👋 Welcome to Provoke Playtech. How can we help you today? Please choose an option below:',
    button_tooltip: 'Chat with Us',
    button_color: '#4f46e5',
    flow: []
  });

  // Simulator State
  const [simMessages, setSimMessages] = useState([]);
  const [simCurrentOptions, setSimCurrentOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('widgets'); // 'widgets' | 'flow' | 'preview'

  // Fetch initial config
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const res = await fetchAdminApi('/floating-widgets/admin/config');
        if (res && res.success && res.data) {
          if (res.data.contact_form) setContactFormConfig(res.data.contact_form);
          if (res.data.chatbot) {
            setChatbotConfig(res.data.chatbot);
            const root = res.data.chatbot.flow?.[0]?.options || [];
            initSimulator(res.data.chatbot.welcome_message, root);
          }
        }
      } catch (err) {
        console.error('Failed to fetch floating widgets config:', err);
        toast.error('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const initSimulator = (welcomeMsg, rootOptions) => {
    setSimMessages([
      {
        sender: 'bot',
        text: welcomeMsg || 'Hi there! How can we help you today?'
      }
    ]);
    setSimCurrentOptions(rootOptions || []);
  };

  const resetSimulator = () => {
    const rootOptions = chatbotConfig.flow?.[0]?.options || [];
    initSimulator(chatbotConfig.welcome_message, rootOptions);
  };

  const handleSimOptionClick = (option) => {
    // 1. User message
    const newMsgs = [
      ...simMessages,
      { sender: 'user', text: option.label }
    ];

    // 2. Bot response
    if (option.action_type === 'link') {
      newMsgs.push({
        sender: 'bot',
        text: option.response_message || `Navigating to: ${option.url}`,
        link: option.url
      });
      setSimMessages(newMsgs);
      setSimCurrentOptions([]);
    } else if (option.action_type === 'lead_form') {
      newMsgs.push({
        sender: 'bot',
        text: option.response_message || 'Please submit your inquiry through the contact form.',
        isLeadForm: true
      });
      setSimMessages(newMsgs);
      setSimCurrentOptions([]);
    } else {
      // Message with possible next options
      newMsgs.push({
        sender: 'bot',
        text: option.response_message || 'Here is more information.'
      });
      setSimMessages(newMsgs);
      setSimCurrentOptions(option.next_options || []);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        contact_form: contactFormConfig,
        chatbot: chatbotConfig
      };

      const res = await fetchAdminApi('/floating-widgets/admin/config', {
        method: 'PUT',
        body: payload
      });

      if (res && res.success) {
        toast.success('Widgets & Chatbot flow saved successfully!');
        resetSimulator();
      } else {
        toast.error(res?.message || 'Failed to save configuration');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Flow Tree Helpers
  const getRootOptions = () => {
    if (!chatbotConfig.flow || chatbotConfig.flow.length === 0) {
      return [];
    }
    return chatbotConfig.flow[0].options || [];
  };

  const updateRootOptions = (newOptions) => {
    const newFlow = [
      {
        id: 'root',
        title: 'Main Menu',
        options: newOptions
      }
    ];
    setChatbotConfig((prev) => ({ ...prev, flow: newFlow }));
  };

  const addRootOption = () => {
    const current = getRootOptions();
    updateRootOptions([...current, DEFAULT_FLOW_ITEM()]);
  };

  const updateOption = (index, field, value) => {
    const current = [...getRootOptions()];
    current[index] = { ...current[index], [field]: value };
    updateRootOptions(current);
  };

  const deleteOption = (index) => {
    const current = [...getRootOptions()];
    current.splice(index, 1);
    updateRootOptions(current);
  };

  // Sub-options helpers
  const addSubOption = (parentIndex) => {
    const current = [...getRootOptions()];
    const parent = current[parentIndex];
    const sub = parent.next_options ? [...parent.next_options] : [];
    sub.push(DEFAULT_FLOW_ITEM());
    current[parentIndex] = { ...parent, next_options: sub };
    updateRootOptions(current);
  };

  const updateSubOption = (parentIndex, subIndex, field, value) => {
    const current = [...getRootOptions()];
    const parent = current[parentIndex];
    const sub = [...(parent.next_options || [])];
    sub[subIndex] = { ...sub[subIndex], [field]: value };
    current[parentIndex] = { ...parent, next_options: sub };
    updateRootOptions(current);
  };

  const deleteSubOption = (parentIndex, subIndex) => {
    const current = [...getRootOptions()];
    const parent = current[parentIndex];
    const sub = [...(parent.next_options || [])];
    sub.splice(subIndex, 1);
    current[parentIndex] = { ...parent, next_options: sub };
    updateRootOptions(current);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw size={28} className="animate-spin mx-auto text-sky-500 mb-2" />
        <p className="font-semibold text-slate-700">Loading Chatbot & Widget Settings...</p>
      </div>
    );
  }

  const rootOptions = getRootOptions();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Floating Widgets & Chatbot</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
              Interactive
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure the bottom-right floating Contact Form (lead capture) and conditional decision-tree Chatbot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSimulator}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset Test Chat
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Flow on Left, Live Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Widget Settings & Conditional Flow */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Toggle & General Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={18} className="text-sky-600" />
              <span>Floating Buttons Visibility & Triggers</span>
            </h2>

            {/* Toggle 1: Contact Form */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <span>1. Floating Contact Form (Lead Collection)</span>
                    {contactFormConfig.enabled ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700 uppercase">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-600 uppercase">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Renders a floating inquiry icon at bottom-right. Opens an instant lead capture modal.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactFormConfig.enabled}
                    onChange={(e) =>
                      setContactFormConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {contactFormConfig.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Modal Title
                    </label>
                    <input
                      type="text"
                      value={contactFormConfig.title}
                      onChange={(e) =>
                        setContactFormConfig((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shake Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={contactFormConfig.shake_interval_seconds}
                      onChange={(e) =>
                        setContactFormConfig((prev) => ({
                          ...prev,
                          shake_interval_seconds: parseInt(e.target.value || '6', 10)
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Gently shakes button every X seconds using lightweight CSS.
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Form Subtitle
                    </label>
                    <input
                      type="text"
                      value={contactFormConfig.subtitle}
                      onChange={(e) =>
                        setContactFormConfig((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 2: Chatbot */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <span>2. Floating Chatbot (Conditional Decision Tree)</span>
                    {chatbotConfig.enabled ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700 uppercase">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-600 uppercase">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Interactive bot with admin-configurable selectable buttons, responses, and hyperlinks.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chatbotConfig.enabled}
                    onChange={(e) =>
                      setChatbotConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {chatbotConfig.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={chatbotConfig.bot_name}
                      onChange={(e) =>
                        setChatbotConfig((prev) => ({ ...prev, bot_name: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status / Subtitle
                    </label>
                    <input
                      type="text"
                      value={chatbotConfig.bot_subtitle}
                      onChange={(e) =>
                        setChatbotConfig((prev) => ({ ...prev, bot_subtitle: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Welcome Message
                    </label>
                    <textarea
                      rows={2}
                      value={chatbotConfig.welcome_message}
                      onChange={(e) =>
                        setChatbotConfig((prev) => ({ ...prev, welcome_message: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Conditional Chatbot Decision Tree Flow */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bot size={18} className="text-indigo-600" />
                  <span>Conditional Chatbot Options Tree</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure the buttons users can select, the bot response, and nested child options or hyperlinks.
                </p>
              </div>

              <button
                type="button"
                onClick={addRootOption}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Button Option
              </button>
            </div>

            {/* Tree Node List */}
            <div className="space-y-4">
              {rootOptions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <p className="text-xs">No options defined yet.</p>
                  <button
                    onClick={addRootOption}
                    className="mt-2 text-xs font-semibold text-indigo-600 underline"
                  >
                    Add first option button
                  </button>
                </div>
              ) : (
                rootOptions.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 transition hover:border-slate-300"
                  >
                    {/* Option Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Option Button</span>
                      </div>
                      <button
                        onClick={() => deleteOption(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Delete this option"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Button Label (What customer clicks)
                        </label>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateOption(idx, 'label', e.target.value)}
                          placeholder="e.g. 📦 Track My Order"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Action When Clicked
                        </label>
                        <select
                          value={opt.action_type}
                          onChange={(e) => updateOption(idx, 'action_type', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="message">🗨️ Bot Responds with Message & Sub-Options</option>
                          <option value="link">🔗 Hyperlink / Open URL</option>
                          <option value="lead_form">📝 Switch to Contact / Lead Form</option>
                        </select>
                      </div>

                      {/* Response Message */}
                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Bot Response Message
                        </label>
                        <textarea
                          rows={2}
                          value={opt.response_message}
                          onChange={(e) => updateOption(idx, 'response_message', e.target.value)}
                          placeholder="What the chatbot will answer..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* URL input if Action is Link */}
                      {opt.action_type === 'link' && (
                        <div className="sm:col-span-12 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                          <label className="block text-[11px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
                            <LinkIcon size={12} /> Hyperlink URL (Internal page e.g. /account/orders or external)
                          </label>
                          <input
                            type="text"
                            value={opt.url || ''}
                            onChange={(e) => updateOption(idx, 'url', e.target.value)}
                            placeholder="/account/orders or https://example.com"
                            className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-indigo-950 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Nested Sub-options if action_type is message */}
                    {opt.action_type === 'message' && (
                      <div className="pt-2 border-t border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Sub-Options / Next Branch ({opt.next_options?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => addSubOption(idx)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Sub-Option
                          </button>
                        </div>

                        {opt.next_options && opt.next_options.length > 0 && (
                          <div className="space-y-2 pl-3 border-l-2 border-indigo-200">
                            {opt.next_options.map((sub, sIdx) => (
                              <div
                                key={sub.id || sIdx}
                                className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={sub.label}
                                    onChange={(e) =>
                                      updateSubOption(idx, sIdx, 'label', e.target.value)
                                    }
                                    placeholder="Sub-option button text"
                                    className="font-semibold text-slate-800 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs w-full max-w-xs"
                                  />
                                  <select
                                    value={sub.action_type}
                                    onChange={(e) =>
                                      updateSubOption(idx, sIdx, 'action_type', e.target.value)
                                    }
                                    className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700"
                                  >
                                    <option value="message">Message</option>
                                    <option value="link">Hyperlink</option>
                                    <option value="lead_form">Contact Form</option>
                                  </select>
                                  <button
                                    onClick={() => deleteSubOption(idx, sIdx)}
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <textarea
                                  rows={1}
                                  value={sub.response_message}
                                  onChange={(e) =>
                                    updateSubOption(idx, sIdx, 'response_message', e.target.value)
                                  }
                                  placeholder="Bot response..."
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                />

                                {sub.action_type === 'link' && (
                                  <input
                                    type="text"
                                    value={sub.url || ''}
                                    onChange={(e) =>
                                      updateSubOption(idx, sIdx, 'url', e.target.value)
                                    }
                                    placeholder="Hyperlink URL (e.g. /products or https://...)"
                                    className="w-full px-2 py-1 bg-indigo-50/50 border border-indigo-200 rounded text-xs font-mono"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Chat Simulator */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Bot Simulator
                </span>
              </div>
              <button
                onClick={resetSimulator}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Simulated Chatbot Device Window */}
            <div className="bg-slate-50 rounded-2xl h-[520px] flex flex-col overflow-hidden text-slate-800 shadow-inner border border-slate-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-sky-600 p-3.5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-none">
                      {chatbotConfig.bot_name || 'Provoke Playtech Assistant'}
                    </h4>
                    <span className="text-[10px] text-white/80 mt-0.5 block">
                      {chatbotConfig.bot_subtitle || 'Online'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {simMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs ${msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                        }`}
                    >
                      {msg.text}

                      {/* Hyperlink Preview */}
                      {msg.link && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <a
                            href={msg.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition text-[11px]"
                          >
                            <span>Open Link: {msg.link}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      {/* Lead Form Trigger Preview */}
                      {msg.isLeadForm && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="p-2 bg-sky-50 rounded-lg text-sky-800 text-[11px] font-medium flex items-center gap-1.5">
                            <MessageSquare size={13} className="text-sky-600" />
                            <span>Floating Contact Form opens here</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Options Selection Area */}
              <div className="p-3 bg-white border-t border-slate-100 shrink-0 space-y-1.5 max-h-48 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Selectable Options:
                </div>
                {simCurrentOptions.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-[11px] text-slate-400">No further options in this path.</p>
                    <button
                      onClick={resetSimulator}
                      className="mt-1 text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Start Over
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {simCurrentOptions.map((opt, idx) => (
                      <button
                        key={opt.id || idx}
                        onClick={() => handleSimOptionClick(opt)}
                        className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 transition flex items-center justify-between group"
                      >
                        <span className="truncate">{opt.label}</span>
                        <ChevronRight
                          size={13}
                          className="text-slate-400 group-hover:text-indigo-600 shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
