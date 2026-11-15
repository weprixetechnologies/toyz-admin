'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Table, Quote, Minus, Undo, Redo, Code, Eye,
  Split, Sparkles, FileText, Check, AlertCircle, Info, HelpCircle,
  Copy, ClipboardPaste, Maximize2, Minimize2, Trash2, ArrowLeft,
  Calendar, Shield, Save, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cleanWordAndRichTextHtml, calculateTextStats } from '../../lib/wordHtmlCleaner';
import { POLICY_TEMPLATES, DEFAULT_STORE_VARIABLES, interpolatePolicyVariables } from '../../lib/policyTemplates';

export default function PolicyEditor({
  initialPolicy = null,
  onSave,
  onCancel,
  saving = false
}) {
  const [formData, setFormData] = useState({
    title: initialPolicy?.title || '',
    slug: initialPolicy?.slug || '',
    type: initialPolicy?.type || 'custom',
    content: initialPolicy?.content || '',
    summary: initialPolicy?.summary || '',
    effective_date: initialPolicy?.effective_date ? initialPolicy.effective_date.split('T')[0] : new Date().toISOString().split('T')[0],
    is_published: initialPolicy?.is_published !== undefined ? Boolean(initialPolicy.is_published) : true,
    meta_title: initialPolicy?.meta_title || '',
    meta_description: initialPolicy?.meta_description || '',
    version: initialPolicy?.version || '1.0'
  });

  // Editor view modes: 'visual', 'code', 'split'
  const [viewMode, setViewMode] = useState('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [wordPasteBuffer, setWordPasteBuffer] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(2);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [storeVars, setStoreVars] = useState(DEFAULT_STORE_VARIABLES);

  const visualEditorRef = useRef(null);
  const isUpdatingFromInternal = useRef(false);

  // Sync content into visual editor on load or view change
  useEffect(() => {
    if (visualEditorRef.current && visualEditorRef.current.innerHTML !== formData.content) {
      isUpdatingFromInternal.current = true;
      visualEditorRef.current.innerHTML = formData.content;
      isUpdatingFromInternal.current = false;
    }
  }, [viewMode]);

  // Set initial content if mounted in visual mode
  useEffect(() => {
    if (visualEditorRef.current && !visualEditorRef.current.innerHTML && formData.content) {
      visualEditorRef.current.innerHTML = formData.content;
    }
  }, []);

  const stats = calculateTextStats(formData.content);

  // Auto-generate slug from title if user hasn't explicitly customized slug
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const isNew = !initialPolicy?.id;
    setFormData(prev => ({
      ...prev,
      title,
      slug: isNew && (!prev.slug || prev.slug === generateSlug(prev.title))
        ? generateSlug(title)
        : prev.slug,
      meta_title: isNew && (!prev.meta_title || prev.meta_title.includes('Policy'))
        ? `${title} | Provoke Playtech`
        : prev.meta_title
    }));
  };

  function generateSlug(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Visual Editor Change Handler
  const handleVisualInput = () => {
    if (!visualEditorRef.current || isUpdatingFromInternal.current) return;
    const html = visualEditorRef.current.innerHTML;
    setFormData(prev => ({ ...prev, content: html }));
  };

  // Direct HTML textarea change handler
  const handleCodeChange = (e) => {
    const html = e.target.value;
    setFormData(prev => ({ ...prev, content: html }));
    if (visualEditorRef.current) {
      isUpdatingFromInternal.current = true;
      visualEditorRef.current.innerHTML = html;
      isUpdatingFromInternal.current = false;
    }
  };

  // Execute standard formatting commands on contentEditable
  const execCmd = (command, value = null) => {
    if (viewMode === 'code') {
      toast.error('Switch to Visual or Split view to format text with buttons');
      return;
    }
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleVisualInput();
  };

  // Rich Text & Word Paste Interceptor in Visual Mode
  const handlePaste = (e) => {
    const html = e.clipboardData?.getData('text/html');
    if (html && (html.includes('mso-') || html.includes('xmlns:o') || html.includes('MsoNormal') || html.includes('WordDocument'))) {
      e.preventDefault();
      const cleaned = cleanWordAndRichTextHtml(html);
      document.execCommand('insertHTML', false, cleaned);
      toast.success('Pasted content cleaned from Microsoft Word formatting!');
      handleVisualInput();
    }
  };

  // Dedicated "Paste from Word/Docs" modal applicator
  const handleApplyWordPaste = () => {
    if (!wordPasteBuffer.trim()) {
      toast.error('Please paste something in the box first');
      return;
    }
    const cleaned = cleanWordAndRichTextHtml(wordPasteBuffer);
    if (viewMode === 'code') {
      setFormData(prev => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${cleaned}` : cleaned
      }));
    } else {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand('insertHTML', false, cleaned);
        handleVisualInput();
      } else {
        setFormData(prev => ({ ...prev, content: cleaned }));
      }
    }
    setWordPasteBuffer('');
    setIsWordModalOpen(false);
    toast.success('Formatted Rich Text cleaned and inserted!');
  };

  // Insert Custom Callout Box
  const insertCallout = (type = 'info') => {
    const styles = {
      info: 'background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 16px 0; border-radius: 6px;',
      warning: 'background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 16px 0; border-radius: 6px;',
      success: 'background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; margin: 16px 0; border-radius: 6px;'
    };
    const html = `<div class="callout callout-${type}" style="${styles[type]}"><p style="margin: 0;"><strong>${type.toUpperCase()}:</strong> Enter important policy note or contact detail here...</p></div><p></p>`;
    execCmd('insertHTML', html);
  };

  // Insert Table
  const insertTable = () => {
    let rowsHtml = '';
    for (let r = 0; r < tableRows; r++) {
      rowsHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        if (r === 0) {
          rowsHtml += `<th style="padding: 10px 14px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-weight: 600; text-align: left;">Header ${c + 1}</th>`;
        } else {
          rowsHtml += `<td style="padding: 10px 14px; border: 1px solid #cbd5e1;">Row ${r} Col ${c + 1}</td>`;
        }
      }
      rowsHtml += '</tr>';
    }
    const tableHtml = `<table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>${rowsHtml}</tbody></table><p></p>`;
    execCmd('insertHTML', tableHtml);
    setIsTableModalOpen(false);
  };

  // Insert Link
  const insertLink = () => {
    if (!linkUrl.trim()) {
      toast.error('URL is required');
      return;
    }
    let validUrl = linkUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://') && !validUrl.startsWith('/') && !validUrl.startsWith('mailto:')) {
      validUrl = 'https://' + validUrl;
    }
    const html = `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${linkText.trim() || validUrl}</a>`;
    execCmd('insertHTML', html);
    setLinkUrl('');
    setLinkText('');
    setIsLinkModalOpen(false);
  };

  // Apply Pre-written Template
  const handleApplyTemplate = (template) => {
    const interpolatedContent = interpolatePolicyVariables(template.content, storeVars);
    const interpolatedMetaTitle = interpolatePolicyVariables(template.metaTitle, storeVars);
    const interpolatedMetaDesc = interpolatePolicyVariables(template.metaDescription, storeVars);
    const interpolatedSummary = interpolatePolicyVariables(template.summary, storeVars);

    setFormData(prev => ({
      ...prev,
      title: prev.title || template.title,
      slug: prev.slug || template.defaultSlug,
      type: template.type,
      content: interpolatedContent,
      meta_title: interpolatedMetaTitle,
      meta_description: interpolatedMetaDesc,
      summary: interpolatedSummary
    }));

    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = interpolatedContent;
    }

    setIsTemplateModalOpen(false);
    toast.success(`Loaded professional ${template.title} template!`);
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a policy title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter policy content');
      return;
    }

    onSave({
      ...formData,
      slug: formData.slug.trim() || generateSlug(formData.title)
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''}`}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#F51F2D]/10 text-[#F51F2D] rounded-lg">
                <Shield size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialPolicy?.id ? 'Edit Legal Policy' : 'Create New Legal Policy'}
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-200 text-slate-700 rounded-full uppercase tracking-wider">
                {formData.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste directly from Microsoft Word / Google Docs or write raw HTML code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Template Picker Button */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Templates Library</span>
          </button>

          {/* Paste from Word Tool */}
          <button
            type="button"
            onClick={() => setIsWordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
            title="Paste formatted text from Microsoft Word or Google Docs"
          >
            <ClipboardPaste size={14} className="text-blue-600" />
            <span>Paste from Word</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Zen Mode'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#F51F2D] hover:bg-[#d91926] active:scale-[0.98] rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving Policy...' : 'Save Policy'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Basic Metadata Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Policy Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Privacy Policy, Cancellation & Refund Policy"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D] outline-none transition"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Category / Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D] outline-none transition"
            >
              <option value="privacy">Privacy Policy</option>
              <option value="refund">Refund & Return Policy</option>
              <option value="terms">Terms & Conditions</option>
              <option value="shipping">Shipping & Delivery</option>
              <option value="cookie">Cookie Policy</option>
              <option value="custom">Custom Policy / Legal Page</option>
            </select>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Effective / Revised Date
            </label>
            <input
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D] outline-none transition"
            />
          </div>
        </div>

        {/* Slug & Publishing Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="md:col-span-8 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Public URL:
            </span>
            <div className="flex items-center flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-600">
              <span className="text-slate-400 select-none">/policies/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="privacy-policy"
                required
                className="w-full outline-none font-mono text-slate-800 bg-transparent px-1"
              />
            </div>
            {formData.slug && (
              <a
                href={`/policies/${formData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                <span>View</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="md:col-span-4 flex items-center justify-end gap-5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Version:</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0"
                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Status:</label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_published ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_published ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${formData.is_published ? 'text-emerald-700' : 'text-slate-500'}`}>
                {formData.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Short Summary / Excerpt */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Short Summary / Key Highlights (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="A brief 1-2 sentence overview shown at the top of the policy page or search results..."
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D] outline-none transition"
          />
        </div>

        {/* Editor Box */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Policy Body Content *</span>
              <span className="text-[11px] font-normal text-slate-500">
                ({stats.words} words • {stats.readingTime})
              </span>
            </label>

            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'visual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye size={13} />
                <span>Visual (Rich Text)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'code' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code size={13} />
                <span>HTML Code</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Split size={13} />
                <span>Split Live Preview</span>
              </button>
            </div>
          </div>

          {/* Full Rich Text Formatting Toolbar */}
          <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 select-none">
              {/* Headings Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    execCmd('formatBlock', `<${e.target.value}>`);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 outline-none hover:border-slate-400"
                title="Format Heading or Paragraph"
              >
                <option value="" disabled>Headings...</option>
                <option value="p">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2 (Main Section)</option>
                <option value="h3">Heading 3 (Subsection)</option>
                <option value="h4">Heading 4</option>
              </select>

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              {/* Basic Styles */}
              <button
                type="button"
                onClick={() => execCmd('bold')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Bold (Ctrl+B)"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Italic (Ctrl+I)"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('underline')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Underline (Ctrl+U)"
              >
                <Underline size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('strikeThrough')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Strikethrough"
              >
                <Strikethrough size={15} />
              </button>

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              {/* Text Alignments */}
              <button
                type="button"
                onClick={() => execCmd('justifyLeft')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Align Left"
              >
                <AlignLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyCenter')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Align Center"
              >
                <AlignCenter size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyRight')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Align Right"
              >
                <AlignRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyFull')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Justify"
              >
                <AlignJustify size={15} />
              </button>

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              {/* Lists */}
              <button
                type="button"
                onClick={() => execCmd('insertUnorderedList')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Bullet List"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('insertOrderedList')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Numbered List"
              >
                <ListOrdered size={15} />
              </button>

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              {/* Link, Table, Callout, Divider */}
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Insert Link"
              >
                <LinkIcon size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Insert Table"
              >
                <Table size={15} />
              </button>

              <button
                type="button"
                onClick={() => execCmd('insertHorizontalRule')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Horizontal Divider"
              >
                <Minus size={15} />
              </button>

              {/* Callout Boxes */}
              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-400">Box:</span>
                <button
                  type="button"
                  onClick={() => insertCallout('info')}
                  className="px-1.5 py-0.5 text-sky-600 hover:bg-sky-50 rounded font-medium"
                  title="Insert Info Callout"
                >
                  Info
                </button>
                <button
                  type="button"
                  onClick={() => insertCallout('warning')}
                  className="px-1.5 py-0.5 text-amber-600 hover:bg-amber-50 rounded font-medium"
                  title="Insert Warning Box"
                >
                  Alert
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 mx-1" />

              {/* Undo / Redo */}
              <button
                type="button"
                onClick={() => execCmd('undo')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Undo"
              >
                <Undo size={14} />
              </button>
              <button
                type="button"
                onClick={() => execCmd('redo')}
                className="p-1.5 text-slate-700 hover:bg-slate-200 rounded-md transition"
                title="Redo"
              >
                <Redo size={14} />
              </button>

              {/* Clear Formatting */}
              <button
                type="button"
                onClick={() => execCmd('removeFormat')}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition text-xs font-semibold ml-auto"
                title="Clear Formatting from selected text"
              >
                Clear Format
              </button>
            </div>

            {/* Editable Canvas / Code Surface */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              {/* Visual Editor Pane */}
              {(viewMode === 'visual' || viewMode === 'split') && (
                <div className={`${viewMode === 'split' ? 'md:col-span-6 border-r border-slate-200' : 'md:col-span-12'} p-5 overflow-y-auto`}>
                  <div
                    ref={visualEditorRef}
                    contentEditable
                    onInput={handleVisualInput}
                    onPaste={handlePaste}
                    className="outline-none min-h-[420px] prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed focus:outline-none focus:ring-0
                      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-slate-100 [&_h2]:pb-1
                      [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-1
                      [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                      [&_li]:mb-1 [&_strong]:font-semibold [&_a]:text-blue-600 [&_a]:underline"
                    placeholder="Start typing your policy or paste from Microsoft Word..."
                  />
                </div>
              )}

              {/* Direct HTML Code Mode */}
              {(viewMode === 'code') && (
                <div className="md:col-span-12 p-3 bg-slate-950 font-mono text-xs">
                  <textarea
                    rows={22}
                    value={formData.content}
                    onChange={handleCodeChange}
                    placeholder="<h2>1. Overview</h2>&#10;<p>Enter raw HTML content directly...</p>"
                    className="w-full h-full min-h-[440px] bg-transparent text-emerald-400 font-mono text-xs outline-none p-3 resize-y leading-relaxed"
                    spellCheck="false"
                  />
                </div>
              )}

              {/* Live Preview Pane in Split View */}
              {(viewMode === 'split') && (
                <div className="md:col-span-6 p-6 bg-slate-50/50 overflow-y-auto max-h-[550px]">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span>Live Storefront Preview</span>
                    <span className="text-emerald-600 font-normal">Real-time sync</span>
                  </div>
                  <div
                    className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed
                      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-1
                      [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-1
                      [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                      [&_li]:mb-1 [&_strong]:font-semibold [&_a]:text-blue-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{
                      __html: formData.content || '<p class="text-slate-400 italic">No content yet. Start typing or apply a template...</p>'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO Metadata Accordion */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Search Engine Optimization (SEO Metadata)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                placeholder="e.g. Privacy Policy | Provoke Playtech"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Meta Description
              </label>
              <input
                type="text"
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="Brief summary appearing in Google search results..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Paste From Word / Docs Modal */}
      {isWordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <ClipboardPaste size={16} />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Paste from Microsoft Word / Google Docs
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Copy text directly from Word, Google Docs, or any web document and paste it here. Our system will automatically clean out messy XML, Mso tags, and keep clean headings, lists, bold, italics, and tables!
              </p>
              <div
                contentEditable
                onInput={(e) => setWordPasteBuffer(e.currentTarget.innerHTML)}
                onPaste={(e) => {
                  const html = e.clipboardData?.getData('text/html');
                  if (html) {
                    e.preventDefault();
                    const cleaned = cleanWordAndRichTextHtml(html);
                    document.execCommand('insertHTML', false, cleaned);
                    setWordPasteBuffer(cleaned);
                  }
                }}
                className="w-full min-h-[180px] max-h-[300px] overflow-y-auto p-3 text-xs border border-blue-200 bg-blue-50/20 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Press Ctrl+V or Cmd+V to paste rich text here..."
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsWordModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyWordPaste}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                Clean & Insert Into Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon size={16} className="text-blue-600" />
              <span>Insert Web Hyperlink</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com or mailto:support@..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Text (Optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Generator Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Table size={16} className="text-indigo-600" />
              <span>Insert Formatted Table</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rows</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Columns</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertTable}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Library Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Professional Legal Policy Templates
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose a pre-drafted legal policy. Variables like store name and email will be filled in automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {POLICY_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{tmpl.title}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded uppercase">
                        {tmpl.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{tmpl.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-200 rounded-xl transition whitespace-nowrap self-start sm:self-center"
                  >
                    <span>Use Template</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
