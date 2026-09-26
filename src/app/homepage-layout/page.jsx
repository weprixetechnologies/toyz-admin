'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Search, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomepageSectionManager() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Drag State
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Modal State
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState('custom_block');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [layoutStyle, setLayoutStyle] = useState('1/1/1'); // Used for both custom blocks (1/1/1, auto) and products (grid, scrollable)
  const [configData, setConfigData] = useState([]);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  // Tag Selection State
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState('');

  // Configuration Constants
  const customBlockOptions = [
    { value: '1', label: '1 Column (100%)', cols: 1, defaultWidths: [100] },
    { value: '1/1', label: '2 Columns (50% / 50%)', cols: 2, defaultWidths: [50, 50] },
    { value: '60/40', label: '2 Columns (60% / 40%)', cols: 2, defaultWidths: [60, 40] },
    { value: '40/60', label: '2 Columns (40% / 60%)', cols: 2, defaultWidths: [40, 60] },
    { value: '1/1/1', label: '3 Columns (33% / 33% / 33%)', cols: 3, defaultWidths: [33.33, 33.33, 33.33] },
    { value: '1/1/1/1', label: '4 Columns (25% / 25% / 25% / 25%)', cols: 4, defaultWidths: [25, 25, 25, 25] },
    { value: 'custom', label: 'Custom Columns', cols: 0, defaultWidths: [] },
    { value: 'auto', label: 'Auto Adjust (Equal Heights)', cols: 0, defaultWidths: [] },
  ];

  const productLayoutOptions = [
    { value: 'grid', label: 'Grid Layout (Default 4 Cols)' },
    { value: 'grid-2', label: 'Grid Layout (2 Columns)' },
    { value: 'grid-3', label: 'Grid Layout (3 Columns)' },
    { value: 'grid-4', label: 'Grid Layout (4 Columns)' },
    { value: 'grid-5', label: 'Grid Layout (5 Columns)' },
    { value: 'grid-6', label: 'Grid Layout (6 Columns)' },
    { value: 'scrollable', label: 'Scrollable Carousel' }
  ];

  const fetchSections = async () => {
    setLoading(true);
    try {
      const [secRes, tagRes] = await Promise.all([
        adminApi.get('/homepage/admin/sections', { _t: Date.now() }),
        adminApi.get('/section-tags', { _t: Date.now() })
      ]);
      if (secRes.success) setSections(secRes.data);
      if (tagRes.success) setAvailableTags(tagRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // --- Handlers for Custom Blocks ---
  const handleBlockLayoutChange = (val) => {
    setLayoutStyle(val);
    const option = customBlockOptions.find(o => o.value === val);
    if (!option || val === 'custom' || val === 'auto') {
      if ((val === 'custom' || val === 'auto') && configData.length === 0) {
        setConfigData([{ image_url: '', link_url: '', width_percentage: 100, aspect_ratio: 1 }]);
      }
      return;
    }
    const newCols = [];
    for (let i = 0; i < option.cols; i++) {
      newCols.push({
        image_url: configData[i]?.image_url || '',
        link_url: configData[i]?.link_url || '',
        width_percentage: option.defaultWidths[i],
        aspect_ratio: 1
      });
    }
    setConfigData(newCols);
  };

  const addCustomColumn = () => setConfigData([...configData, { image_url: '', link_url: '', width_percentage: 20, aspect_ratio: 1 }]);
  const removeCustomColumn = (idx) => {
    const newCols = [...configData];
    newCols.splice(idx, 1);
    setConfigData(newCols);
  };

  const handleImageUpload = async (file, index) => {
    if (!file) return;
    try {
      const getAspectRatio = (f) => new Promise(res => {
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => { res(img.width / img.height); URL.revokeObjectURL(url); };
        img.onerror = () => { res(1); URL.revokeObjectURL(url); };
        img.src = url;
      });
      const ratio = await getAspectRatio(file);

      const res = await adminApi.post(`/storage/upload?key=homepage/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}&contentType=${file.type}`);
      if (!res.success) throw new Error("Failed to get upload URL");
      
      const { uploadUrl, fileUrl } = res.data;
      const fullUploadUrl = uploadUrl.startsWith('http') ? uploadUrl : adminApi.baseURL.replace('/api/v1', '') + uploadUrl;
      
      const uploadRes = await fetch(fullUploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");
      
      const newCols = [...configData];
      newCols[index].image_url = fileUrl;
      newCols[index].aspect_ratio = ratio;
      setConfigData(newCols);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    }
  };

  const recalculateAspectRatio = (idx) => {
    const col = configData[idx];
    if (!col.image_url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const newCols = [...configData];
      newCols[idx].aspect_ratio = img.width / img.height;
      setConfigData(newCols);
    };
    img.onerror = () => alert('Failed to load image');
    img.src = col.image_url;
  };

  // --- Modal Management ---

  const openNew = () => {
    setEditingId(null);
    setType('custom_block');
    setTitle('');
    setSubtitle('');
    setLayoutStyle('1/1/1');
    setConfigData([{ image_url: '', link_url: '', width_percentage: 33.33 }, { image_url: '', link_url: '', width_percentage: 33.33 }, { image_url: '', link_url: '', width_percentage: 33.33 }]);
    setSelectedTagId('');
    setSortOrder(0);
    setIsActive(true);
    setShowModal(true);
  };

  const openEdit = (sec) => {
    setEditingId(sec.id);
    setType(sec.type);
    setTitle(sec.title || '');
    setSubtitle(sec.subtitle || '');
    setLayoutStyle(sec.layout_style || (sec.type === 'custom_block' ? '1/1/1' : 'grid'));
    setConfigData(sec.config_data || []);
    setSelectedTagId(sec.config_data?.tag_id || '');
    setSortOrder(sec.sort_order);
    setIsActive(sec.is_active === 1);
    setShowModal(true);
  };

  const deleteSection = async (id) => {
    if (!confirm('Delete this section?')) return;
    await adminApi.delete(`/homepage/admin/sections/${id}`);
    fetchSections();
  };

  const saveSection = async (e) => {
    e.preventDefault();
    const payload = {
      type,
      title,
      subtitle,
      layout_style: layoutStyle,
      config_data: type === 'custom_block' ? configData : { tag_id: selectedTagId },
      sort_order: parseInt(sortOrder),
      is_active: isActive,
      products: []
    };

    try {
      if (editingId) {
        await adminApi.put(`/homepage/admin/sections/${editingId}`, payload);
      } else {
        await adminApi.post('/homepage/admin/sections', payload);
      }
      setShowModal(false);
      fetchSections();
    } catch (err) {
      alert('Failed to save section');
    }
  };


  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedId === id) return;
    setDragOverId(id);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;

    const list = [...sections];
    const draggedIndex = list.findIndex(s => s.id === draggedId);
    const targetIndex = list.findIndex(s => s.id === targetId);
    
    const [draggedItem] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, draggedItem);
    
    const updatedList = list.map((item, index) => ({
      ...item,
      sort_order: index + 1
    }));
    
    setSections(updatedList);
    
    const updates = updatedList.map(item => ({ id: item.id, sort_order: item.sort_order }));
    try {
      await adminApi.put('/homepage/admin/sections/reorder', { updates });
      toast.success('Sections reordered!');
    } catch(err) {
      toast.error('Failed to reorder');
      fetchSections(); 
    }
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Master Section Manager</h1>
        <button onClick={openNew} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 flex items-center gap-2">
          <Plus size={16} /> Add Section
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec) => (
            <div 
              key={sec.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, sec.id)}
              onDragOver={(e) => handleDragOver(e, sec.id)}
              onDrop={(e) => handleDrop(e, sec.id)}
              onDragEnd={handleDragEnd}
              className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between transition-all cursor-move
                ${draggedId === sec.id ? 'opacity-50 border-sky-400 bg-sky-50 shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}
                ${dragOverId === sec.id ? 'border-t-4 border-t-sky-500 rounded-t-sm' : ''}
              `}
            >
              <div className="text-gray-400 mr-3 hidden sm:block">
                <GripVertical size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-sm bg-gray-100 px-2 py-1 rounded">
                    {sec.type === 'custom_block' ? 'Custom Block' : 'Product Showcase'}
                  </span>
                  {sec.type === 'product_section' && <span className="font-bold text-sm text-gray-700">{sec.title}</span>}
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-500 rounded border border-gray-200">
                    Style: {sec.layout_style}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${sec.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {sec.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-xs text-gray-500">Order: {sec.sort_order}</span>
                </div>
                
                {sec.type === 'custom_block' ? (
                  <div className="flex gap-2">
                    {(sec.config_data || []).map((col, idx) => (
                      <div key={idx} className="h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden" style={{ width: `${col.width_percentage || 20}%` }}>
                        {col.image_url ? <img src={col.image_url} className="h-full object-cover opacity-50" /> : <span className="text-[10px] text-gray-400">Empty</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {(sec.products || []).map(p => (
                      <div key={p.id} className="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                        {p.primary_image ? <img src={p.primary_image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100"></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => openEdit(sec)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"><Edit2 size={18} /></button>
                <button onClick={() => deleteSection(sec.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              No sections exist. Click "Add Section" to create your homepage layout.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Section' : 'Add Section'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={saveSection} className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Section Type</label>
                  <select value={type} onChange={(e) => {
                    const newType = e.target.value;
                    setType(newType);
                    setLayoutStyle(newType === 'custom_block' ? '1/1/1' : 'grid');
                  }} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium">
                    <option value="custom_block">Custom Block (Banners / Images)</option>
                    <option value="product_section">Product Showcase</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Layout Style</label>
                  <select value={layoutStyle} onChange={e => {
                    if (type === 'custom_block') {
                      handleBlockLayoutChange(e.target.value);
                    } else {
                      setLayoutStyle(e.target.value);
                    }
                  }} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium">
                    {type === 'custom_block' ? customBlockOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )) : productLayoutOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {type === 'product_section' && (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Flash Deals" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" required />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                      <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Limited Time Offers!" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                    </div>
                  </>
                )}
                
                <div className="col-span-2 flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4" />
                    <label htmlFor="isActive" className="text-sm text-gray-700 font-medium">Section is Active</label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 text-right">Sort Order</label>
                    <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-20 p-1 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 outline-none text-right" />
                  </div>
                </div>
              </div>

              {/* --- CUSTOM BLOCK CONFIG --- */}
              {type === 'custom_block' && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm">Columns Configuration</h3>
                    {(layoutStyle === 'custom' || layoutStyle === 'auto') && (
                      <button type="button" onClick={addCustomColumn} className="bg-sky-100 text-sky-700 px-3 py-1 text-xs font-bold rounded hover:bg-sky-200">
                        + Add Column
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {configData.map((col, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col gap-3" style={{ width: (layoutStyle === 'custom' || layoutStyle === 'auto') ? 'calc(50% - 1rem)' : `${col.width_percentage}%`, flexGrow: (layoutStyle === 'custom' || layoutStyle === 'auto') ? 0 : 1 }}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs font-bold text-gray-500">Column {idx + 1}</div>
                          {(layoutStyle === 'custom' || layoutStyle === 'auto') && (
                            <button type="button" onClick={() => removeCustomColumn(idx)} className="text-red-500 hover:text-red-700">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        
                        {layoutStyle !== 'auto' && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-700 w-20">Width (%)</label>
                            <input type="number" step="0.01" value={col.width_percentage} onChange={(e) => {
                              const newCols = [...configData];
                              newCols[idx].width_percentage = parseFloat(e.target.value) || 0;
                              setConfigData(newCols);
                            }} className="flex-1 p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
                          </div>
                        )}
                        {layoutStyle === 'auto' && (
                          <div className="flex items-center justify-between text-xs text-sky-600 bg-sky-50 p-2 rounded border border-sky-100">
                            <span>Auto Adjust: {col.aspect_ratio ? col.aspect_ratio.toFixed(2) : 'Pending'}</span>
                            {col.image_url && (
                              <button type="button" onClick={() => recalculateAspectRatio(idx)} className="underline font-bold hover:text-sky-800">
                                Calculate Again
                              </button>
                            )}
                          </div>
                        )}
                        
                        {col.image_url ? (
                          <div className="relative rounded-lg overflow-hidden border border-gray-200">
                            <img src={col.image_url} alt="Col" className="w-full h-auto object-cover" />
                            <button type="button" onClick={() => {
                              const newCols = [...configData];
                              newCols[idx].image_url = '';
                              setConfigData(newCols);
                            }} className="absolute top-1 right-1 bg-white p-1 rounded shadow text-red-500 hover:text-red-700">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 transition">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], idx)} className="hidden" id={`img-upload-${idx}`} />
                            <label htmlFor={`img-upload-${idx}`} className="cursor-pointer flex flex-col items-center text-sky-600">
                              <ImageIcon size={20} className="mb-1" />
                              <span className="text-xs font-semibold">Upload Image</span>
                            </label>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Link URL (Optional)</label>
                          <input type="text" placeholder="e.g. /categories/rc-cars" value={col.link_url} onChange={(e) => {
                            const newCols = [...configData];
                            newCols[idx].link_url = e.target.value;
                            setConfigData(newCols);
                          }} className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-sky-500 outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- PRODUCT SHOWCASE CONFIG --- */}
              {type === 'product_section' && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm">Product Tag Source</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Section Tag</label>
                    <select 
                      value={selectedTagId} 
                      onChange={e => setSelectedTagId(e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    >
                      <option value="">-- Choose a Tag --</option>
                      {availableTags.map(tag => (
                        <option key={tag.id} value={tag.id}>{tag.name} ({tag.products?.length || 0} products)</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      The products assigned to this tag will automatically be displayed in this section.
                    </p>
                  </div>
                </div>
              )}

            </form>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              <button onClick={saveSection} className="px-5 py-2 text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 rounded-lg transition flex items-center gap-2">
                <Save size={16} /> Save Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
