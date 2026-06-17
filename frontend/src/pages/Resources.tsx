import React, { useState, useEffect } from 'react';
import { getResources, uploadResource, purchaseResource, ResourceResponse } from '../services/resourceService';
import { SecureViewer } from '../components/SecureViewer';
import {
  BookOpen,
  PlusCircle,
  Lock,
  Unlock,
  CheckCircle,
  FileText,
  Video,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Upload
} from 'lucide-react';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<ResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PDF' | 'LINK' | 'VIDEO' | 'NOTE' | 'BOOK'>('PDF');
  const [price, setPrice] = useState('0.0');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Secure View State
  const [activeViewerResource, setActiveViewerResource] = useState<{ id: number; title: string; type: string } | null>(null);

  // Purchase Modal State
  const [pendingPurchaseResource, setPendingPurchaseResource] = useState<ResourceResponse | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getResources();
      setResources(data);
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve learning materials. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Form Submit (Upload Material)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Material title is required');
      return;
    }
    if (!selectedFile) {
      setFormError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('price', parseFloat(price).toString());
      formData.append('file', selectedFile);

      await uploadResource(formData);
      
      // Reset Form
      setTitle('');
      setDescription('');
      setType('PDF');
      setPrice('0.0');
      setSelectedFile(null);
      
      // Go to browse and reload
      setActiveTab('browse');
      await fetchResources();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to upload learning material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Purchase Submit
  const handleConfirmPurchase = async () => {
    if (!pendingPurchaseResource) return;
    try {
      setPurchasing(true);
      await purchaseResource(pendingPurchaseResource.id);
      setPendingPurchaseResource(null);
      // Refresh list
      await fetchResources();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Purchase failed.');
    } finally {
      setPurchasing(false);
    }
  };

  // File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Filter Logic
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || res.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Learning Materials & Notes
          </h1>
          <p className="text-zinc-400 text-sm">
            Publish educational materials, set prices, and browse DRM-secured notes.
          </p>
        </div>

        {/* Tab Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Browse Materials
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Upload Material
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-950/20 p-4 border border-zinc-800 rounded-xl">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {['ALL', 'PDF', 'NOTE', 'BOOK', 'VIDEO'].map((typeOption) => (
                <button
                  key={typeOption}
                  onClick={() => setFilterType(typeOption)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    filterType === typeOption
                      ? 'bg-zinc-850 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {typeOption}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Retrieving learning materials...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 p-6 border border-zinc-800 bg-zinc-950/20 rounded-xl max-w-md mx-auto space-y-3">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm text-zinc-300 font-semibold">{error}</p>
              <button
                onClick={fetchResources}
                className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 text-xs font-semibold rounded-lg hover:bg-zinc-850 text-zinc-300 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-sm text-zinc-500">No learning materials found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res) => {
                const canView = res.isOwner || res.isPurchased || res.price <= 0.0;
                return (
                  <div
                    key={res.id}
                    className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/30 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 border border-zinc-850 text-zinc-400">
                          {res.type === 'PDF' && <FileText className="w-3 h-3 text-red-400" />}
                          {res.type === 'VIDEO' && <Video className="w-3 h-3 text-indigo-400" />}
                          {res.type !== 'PDF' && res.type !== 'VIDEO' && <BookOpen className="w-3 h-3 text-purple-400" />}
                          {res.type}
                        </span>
                        
                        <span className="text-xs font-bold text-zinc-200">
                          {res.price > 0.0 ? `$${res.price.toFixed(2)}` : 'FREE'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-zinc-100 truncate">{res.title}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {res.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-850/60 flex items-center justify-between">
                      <div className="text-[10px] text-zinc-500">
                        <span>By {res.ownerName}</span>
                      </div>

                      {canView ? (
                        <button
                          onClick={() => setActiveViewerResource({ id: res.id, title: res.title, type: res.type })}
                          className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          Open Secure View
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingPurchaseResource(res)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          Unlock Materials
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Upload Form Screen */
        <div className="max-w-xl mx-auto bg-zinc-950/20 border border-zinc-800 rounded-xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-850">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-zinc-100">Publish Learning Material</h3>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Material Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Design Cheat Sheets"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the material (topics covered, who it is for)..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Material Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="BOOK">E-Book</option>
                  <option value="NOTE">Short Notes</option>
                  <option value="VIDEO">Video Guide</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Custom Drag & Drop / File Input Design */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Document File</label>
              <div className="relative border border-dashed border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all text-center">
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1.5">
                  <PlusCircle className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-xs text-zinc-300 font-medium">
                    {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
                  </p>
                  <p className="text-[10px] text-zinc-500">PDF and Image formats supported (Max 10MB)</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" /> Publish Material
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* SECURE VIEWER SCREEN OVERLAY */}
      {activeViewerResource && (
        <SecureViewer
          resourceId={activeViewerResource.id}
          resourceTitle={activeViewerResource.title}
          resourceType={activeViewerResource.type}
          onClose={() => setActiveViewerResource(null)}
        />
      )}

      {/* MOCK PURCHASE MODAL */}
      {pendingPurchaseResource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-zinc-100">Unlock Learning Material</h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                You are purchasing the following secured learning material. Access will be bound to your account email:
              </p>
              
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-850 space-y-1.5">
                <div className="text-xs font-bold text-zinc-200">{pendingPurchaseResource.title}</div>
                <div className="text-[10px] text-zinc-500">Author: {pendingPurchaseResource.ownerName}</div>
                <div className="text-xs font-semibold text-indigo-400 flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{pendingPurchaseResource.price.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] text-emerald-400 leading-normal">
                🔐 <strong>DRM Notice:</strong> Under copyright terms, saving, downloading, screenshots, and screen recording are blocked on the secure viewer canvas.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPendingPurchaseResource(null)}
                className="flex-1 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {purchasing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Authorize Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
