import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useAdminMarketplaceQuery,
  useUpdateListingStatusMutation,
  useDeleteListingMutation,
} from '@/features/admin/hooks/useAdmin'
import {
  useAdminStoreResourcesQuery,
  useAdminCreateStoreResourceMutation,
  useAdminDeleteStoreResourceMutation,
} from '@/features/marketplace/hooks/useStore'
import { StoreResourceRequest } from '@/features/marketplace/api/storeApi'
import {
  Loader2,
  Check,
  XCircle,
  Trash2,
  ShoppingBag,
  Plus,
  FilePlus,
  Clock,
  Layers,
  X,
  BookOpen,
  Upload,
  Link as LinkIcon,
  FileText,
  Paperclip,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function AdminMarketplace() {
  const [activeTab, setActiveTab] = useState<'STORE_MANAGEMENT' | 'P2P_MODERATION'>('STORE_MANAGEMENT')

  // Moderation filter
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED'>('ALL')

  // Create store modal & Drag/Drop state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [attachmentMode, setAttachmentMode] = useState<'FILE' | 'LINK'>('FILE')
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<StoreResourceRequest>({
    title: '',
    description: '',
    category: '',
    priceInRupees: 0,
    expiryDate: '',
    fileUrl: '',
    fileName: '',
    tags: '',
  })
  const [priceInputText, setPriceInputText] = useState<string>('')

  const handleFileSelect = (file: File) => {
    setIsReadingFile(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setFormData((prev) => ({
        ...prev,
        fileUrl: dataUrl || URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
      }))
      setIsReadingFile(false)
    }
    reader.onerror = () => {
      setIsReadingFile(false)
    }
    reader.readAsDataURL(file)
  }

  // Queries & Mutations
  const { data: listings, isLoading: isListingsLoading } = useAdminMarketplaceQuery()
  const { data: storeResources = [], isLoading: isStoreLoading } = useAdminStoreResourcesQuery()

  const updateStatusMutation = useUpdateListingStatusMutation()
  const deleteListingMutation = useDeleteListingMutation()
  const createStoreMutation = useAdminCreateStoreResourceMutation()
  const deleteStoreMutation = useAdminDeleteStoreResourceMutation()

  const filteredListings = listings?.filter((item) => {
    if (filter === 'ALL') return true
    return item.status === filter
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.category || !formData.fileUrl) return

    const finalPrice = priceInputText === '' ? 0 : Number(priceInputText)

    const payload: StoreResourceRequest = {
      ...formData,
      priceInRupees: finalPrice,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
    }

    createStoreMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateModalOpen(false)
        setFormData({
          title: '',
          description: '',
          category: '',
          priceInRupees: 0,
          expiryDate: '',
          fileUrl: '',
          fileName: '',
          tags: '',
        })
        setPriceInputText('')
      },
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-500">PENDING</Badge>
      case 'ACTIVE':
        return <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5">APPROVED</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="text-[9px] bg-destructive/10 text-destructive">REJECTED</Badge>
      default:
        return <Badge variant="outline" className="text-[9px] text-muted-foreground">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="size-5.5 text-emerald-400" />
            Marketplace & Store Administration
          </h1>
          <p className="text-xs text-muted-foreground">
            Upload premium study notes with INR prices & expiry dates, or moderate student listings.
          </p>
        </div>

        {activeTab === 'STORE_MANAGEMENT' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0"
          >
            <Plus className="size-4" />
            Upload Store Notes / Resource
          </Button>
        )}
      </div>

      {/* Main Admin Mode Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-card border border-border/60 w-fit">
        <Button
          variant={activeTab === 'STORE_MANAGEMENT' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('STORE_MANAGEMENT')}
          className="text-xs font-semibold h-8 px-4 gap-1.5"
        >
          <BookOpen className="size-3.5 text-emerald-400" />
          Academic Notes Store ({storeResources.length})
        </Button>
        <Button
          variant={activeTab === 'P2P_MODERATION' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('P2P_MODERATION')}
          className="text-xs font-semibold h-8 px-4 gap-1.5"
        >
          <Layers className="size-3.5 text-indigo-400" />
          Campus P2P Moderation ({listings?.length || 0})
        </Button>
      </div>

      {activeTab === 'STORE_MANAGEMENT' ? (
        /* Store Resources Uploaded by Admin */
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="py-4 px-5 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Active Premium Notes Catalog</span>
              <span className="text-xs font-normal text-muted-foreground">Visible to all students in Marketplace</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isStoreLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="size-6 animate-spin text-emerald-400" />
                <p className="text-xs text-muted-foreground">Loading store resources index…</p>
              </div>
            ) : storeResources.length === 0 ? (
              <div className="text-center py-20 text-xs text-muted-foreground space-y-2">
                <p>No premium store resources uploaded yet.</p>
                <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)} className="text-xs">
                  Upload First Store Resource
                </Button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Notes Title & File</th>
                    <th className="py-3 px-4 w-[120px]">Category</th>
                    <th className="py-3 px-4 w-[100px]">Price (INR)</th>
                    <th className="py-3 px-4 w-[160px]">Access Expiry</th>
                    <th className="py-3 px-4 w-[90px]">Status</th>
                    <th className="py-3 px-4 text-right w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storeResources.map((item) => (
                    <tr key={item.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-foreground">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[320px] truncate">
                            {item.description || 'No description provided.'}
                          </div>
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] text-emerald-400 hover:underline font-mono mt-1"
                            >
                              <span>📄 {item.fileName || 'Attachment Document'}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {item.category}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ₹{item.priceInRupees}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-medium">
                        {item.expiryDate ? (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400">
                            <Clock className="size-3 shrink-0" />
                            <span>{new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Permanent Access</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.active ? (
                          <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                            LIVE
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px]">INACTIVE</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="hover:bg-destructive/10 border-transparent text-destructive"
                          title="Deactivate Store Resource"
                          onClick={() => {
                            if (confirm(`Deactivate store resource "${item.title}"?`)) {
                              deleteStoreMutation.mutate(item.id)
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* P2P Campus Moderation Queue */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border/60 w-fit">
            {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'ARCHIVED'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'secondary' : 'ghost'}
                size="xs"
                onClick={() => setFilter(status)}
                className="text-[10px] font-semibold h-7.5 px-3 rounded-lg"
              >
                {status === 'ACTIVE' ? 'APPROVED' : status}
              </Button>
            ))}
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-border/60">
            <CardContent className="p-0 overflow-x-auto">
              {isListingsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading active marketplace index…</p>
                </div>
              ) : !filteredListings || filteredListings.length === 0 ? (
                <div className="text-center py-20 text-xs text-muted-foreground">
                  No marketplace listings found in this category.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4 w-[120px]">Seller</th>
                      <th className="py-3 px-4 w-[110px]">Category</th>
                      <th className="py-3 px-4 w-[100px]">Price</th>
                      <th className="py-3 px-4 w-[100px]">Status</th>
                      <th className="py-3 px-4 text-right w-[180px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((item) => (
                      <tr key={item.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-semibold text-foreground">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[280px] truncate">
                              {item.description || 'No description provided.'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-muted-foreground">
                          {item.seller?.username || 'System User'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[10px] text-muted-foreground">
                          {item.category?.replaceAll('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          ${item.price}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {item.status !== 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="hover:bg-emerald-500/10 border-transparent text-emerald-400"
                              onClick={() => updateStatusMutation.mutate({ listingId: item.id, status: 'ACTIVE' })}
                            >
                              <Check className="size-3.5" />
                            </Button>
                          )}
                          {item.status !== 'REJECTED' && (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="hover:bg-destructive/10 border-transparent text-destructive"
                              onClick={() => updateStatusMutation.mutate({ listingId: item.id, status: 'REJECTED' })}
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="hover:bg-destructive/10 border-transparent text-destructive"
                            onClick={() => {
                              if (confirm(`Permanently delete listing "${item.title}"?`)) {
                                deleteListingMutation.mutate(item.id)
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Store Notes Upload Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FilePlus className="size-5 text-emerald-400" />
                  <span className="font-bold text-sm text-foreground">Upload Store Notes / Resource</span>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Resource / Notes Title *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Placement Prep Masterkit 2026 (DSA + System Design)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Category & Price in INR */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Category *</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Placement, General, GATE Prep..."
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Price in INR (₹) *</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 for Free, or enter price (e.g. 99)"
                      value={priceInputText}
                      onChange={(e) => setPriceInputText(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center justify-between">
                    <span>Access Expiry Date (Optional)</span>
                    <span className="text-[10px] text-muted-foreground">Leave empty for permanent access</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onFocus={(e) => e.currentTarget.showPicker?.()}
                    className="h-9 text-xs cursor-pointer [color-scheme:dark]"
                  />
                </div>

                {/* Document Attachment: Drag & Drop PDF or Link */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                      <Paperclip className="size-3.5 text-emerald-400" />
                      <span>Document / PDF Source *</span>
                    </label>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/50 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setAttachmentMode('FILE')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                          attachmentMode === 'FILE'
                            ? 'bg-card text-emerald-400 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        📄 Drag & Drop PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachmentMode('LINK')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                          attachmentMode === 'LINK'
                            ? 'bg-card text-emerald-400 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        🔗 External URL
                      </button>
                    </div>
                  </div>

                  {attachmentMode === 'FILE' ? (
                    <div>
                      {formData.fileName && formData.fileUrl ? (
                        /* Selected File Preview Card */
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                              <FileText className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{formData.fileName}</p>
                              <p className="text-[10px] text-emerald-400/90 font-mono">
                                {formData.fileSize ? `${(formData.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'PDF Document Ready'}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              if (fileInputRef.current) fileInputRef.current.value = ''
                              setFormData((prev) => ({ ...prev, fileUrl: '', fileName: '', fileSize: undefined }))
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        /* Drag and Drop Zone */
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setDragActive(true)
                          }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setDragActive(false)
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileSelect(e.dataTransfer.files[0])
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            dragActive
                              ? 'border-emerald-400 bg-emerald-500/10 scale-[0.99]'
                              : 'border-border/80 hover:border-emerald-500/50 bg-muted/20 hover:bg-muted/40'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileSelect(e.target.files[0])
                              }
                            }}
                          />
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400">
                              <Upload className="size-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-foreground">
                                <span className="text-emerald-400 underline underline-offset-2">Click to browse</span> or drag & drop PDF notes file
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Supports PDF, DOCX, PNG (Max 50MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Link URL Input */
                    <div className="relative">
                      <Input
                        type="url"
                        required
                        placeholder="https://... / paste link to PDF document"
                        value={formData.fileUrl}
                        onChange={(e) => {
                          const val = e.target.value
                          setFormData((prev) => ({
                            ...prev,
                            fileUrl: val,
                            fileName: val ? val.substring(val.lastIndexOf('/') + 1) || 'PDF Document' : '',
                          }))
                        }}
                        className="h-9 text-xs font-mono pl-8"
                      />
                      <LinkIcon className="size-3.5 text-muted-foreground absolute left-2.5 top-3" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Detailed Description</label>
                  <Textarea
                    placeholder="Provide a overview of what topics and problems are covered in this study resource..."
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    className="text-xs min-h-[80px]"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Tags (Comma separated)</label>
                  <Input
                    type="text"
                    placeholder="Placement, DSA, Core CS, Java"
                    value={formData.tags || ''}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={createStoreMutation.isPending || isReadingFile}
                    className="w-full text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {createStoreMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Publishing to Marketplace…
                      </>
                    ) : isReadingFile ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing Attached PDF…
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        Publish Store Resource {priceInputText && Number(priceInputText) > 0 ? `(₹${priceInputText})` : '(Free / ₹0)'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
