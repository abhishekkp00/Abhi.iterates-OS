import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useStoreResourcesQuery,
  useStoreCategoriesQuery,
  useMyPurchasesQuery,
  useUpiPurchaseMutation,
} from '@/features/marketplace/hooks/useStore'
import { StoreResourceItem } from '@/features/marketplace/api/storeApi'
import {
  Search,
  BookOpen,
  CheckCircle2,
  Lock,
  Download,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
  Layers,
  FileText,
  Copy,
  Check,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewTab, setViewTab] = useState<'EXPLORE' | 'MY_NOTES'>('EXPLORE')

  // Modals state
  const [purchasingItem, setPurchasingItem] = useState<StoreResourceItem | null>(null)
  const [viewingItem, setViewingItem] = useState<StoreResourceItem | null>(null)
  const [upiRefInput, setUpiRefInput] = useState<string>('')
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false)

  // API Queries
  const { data: categories = ['Placement', 'General'] } = useStoreCategoriesQuery()
  const { data: storePage, isLoading } = useStoreResourcesQuery({
    search: searchQuery,
    category: selectedCategory === 'ALL' ? undefined : selectedCategory,
  })
  const { data: myPurchases = [] } = useMyPurchasesQuery()
  const upiMutation = useUpiPurchaseMutation()

  const storeItems: StoreResourceItem[] = storePage?.content || []

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('abhiiterates@upi')
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchasingItem || !upiRefInput.trim()) return

    upiMutation.mutate(
      {
        resourceId: purchasingItem.id,
        payload: { paymentRefId: upiRefInput.trim() },
      },
      {
        onSuccess: () => {
          setPurchasingItem(null)
          setUpiRefInput('')
        },
      }
    )
  }

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes('placement')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    if (cat.includes('general')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (cat.includes('gate')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 sm:p-8 border border-emerald-500/20 shadow-xl">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
            <Sparkles className="size-3.5" />
            <span>Campus Academic Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Verified Study Notes & Placement Materials
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Instant UPI access to premium handwritten notes, placement handbooks, GATE solved banks, and lab manuals verified by top rankers.
          </p>

          {/* Tab switches */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant={viewTab === 'EXPLORE' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewTab('EXPLORE')}
              className="gap-1.5 text-xs font-semibold"
            >
              <Layers className="size-3.5" />
              Explore Catalog
            </Button>
            <Button
              variant={viewTab === 'MY_NOTES' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewTab('MY_NOTES')}
              className="gap-1.5 text-xs font-semibold relative"
            >
              <BookOpen className="size-3.5" />
              My Unlocked Notes
              {myPurchases.length > 0 && (
                <span className="ml-1 rounded-full bg-emerald-500 text-[10px] font-bold px-1.5 py-0.2 text-slate-950">
                  {myPurchases.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {viewTab === 'EXPLORE' ? (
        <>
          {/* Controls Bar: Search & Category Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notes, topics, Placement, GATE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-card border-border/80"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border/60">
              <Button
                variant={selectedCategory === 'ALL' ? 'secondary' : 'ghost'}
                size="xs"
                onClick={() => setSelectedCategory('ALL')}
                className="text-[11px] font-semibold h-7.5 px-3 rounded-lg"
              >
                All Categories
              </Button>
              {categories.map((cat: string) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-[11px] font-semibold h-7.5 px-3 rounded-lg"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Store Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="size-8 animate-spin text-emerald-500" />
              <p className="text-xs text-muted-foreground font-medium">Fetching verified academic notes catalog...</p>
            </div>
          ) : storeItems.length === 0 ? (
            <Card className="bg-card/50 border-dashed border-border/80 py-16 text-center">
              <CardContent className="space-y-3">
                <FileText className="size-10 mx-auto text-muted-foreground/50" />
                <h3 className="text-sm font-semibold text-foreground">No notes found in this category</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search query or selecting a different category tab above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {storeItems.map((item: StoreResourceItem) => {
                const isUnlocked = item.isPurchased && !item.isExpired

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full flex flex-col justify-between bg-card/60 backdrop-blur-sm border-border/60 hover:border-emerald-500/40 transition-all duration-200 hover:shadow-md group">
                      <CardHeader className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </Badge>

                          <div className="flex items-center gap-1 font-mono font-bold text-base text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <span>₹{item.priceInRupees}</span>
                          </div>
                        </div>

                        <CardTitle className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </CardTitle>

                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </CardHeader>

                      <CardContent className="px-4 py-2 space-y-2 text-[11px] text-muted-foreground border-t border-border/30 mt-auto">
                        {item.expiryDate && (
                          <div className="flex items-center gap-1.5 text-amber-500/90 font-medium">
                            <Clock className="size-3 shrink-0" />
                            <span>Access valid until {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}

                        {item.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.split(',').map((tag: string) => (
                              <span key={tag} className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="p-4 pt-3 border-t border-border/40">
                        {isUnlocked ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setViewingItem(item)}
                            className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Unlocked — Access Notes
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setPurchasingItem(item)}
                            className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                          >
                            <Lock className="size-3.5" />
                            Buy via UPI (₹{item.priceInRupees})
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* My Purchases View */
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="size-4 text-emerald-400" />
            My Unlocked Study Notes ({myPurchases.length})
          </h2>

          {myPurchases.length === 0 ? (
            <Card className="bg-card/50 border-dashed border-border/80 py-16 text-center">
              <CardContent className="space-y-3">
                <Lock className="size-10 mx-auto text-muted-foreground/50" />
                <h3 className="text-sm font-semibold text-foreground">No unlocked notes yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Browse the catalog and unlock placement and subject notes with UPI.
                </p>
                <Button variant="outline" size="sm" onClick={() => setViewTab('EXPLORE')} className="text-xs">
                  Browse Notes Catalog
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPurchases.map((item) => (
                <Card key={item.id} className="bg-card/60 border-border/60">
                  <CardHeader className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-400">
                        Unlocked via UPI
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground pt-1">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-2 space-y-1 text-xs text-muted-foreground">
                    <p className="line-clamp-2">{item.description}</p>
                    {item.paymentRefId && (
                      <p className="text-[10px] font-mono text-muted-foreground/80">UTR Ref: {item.paymentRefId}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-2 flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewingItem(item)}
                      className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <BookOpen className="size-3.5" />
                      View Notes Online
                    </Button>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" download>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5">
                        <Download className="size-3.5" />
                        Download
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPI Payment Modal */}
      <AnimatePresence>
        {purchasingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-400" />
                  <span className="font-bold text-sm text-foreground">UPI Instant Unlock</span>
                </div>
                <button
                  onClick={() => setPurchasingItem(null)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Form & UPI Details */}
              <form onSubmit={handleUpiSubmit} className="p-5 space-y-4">
                {/* Item Summary */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Order Item</p>
                  <p className="text-xs font-bold text-foreground line-clamp-1">{purchasingItem.title}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">Category: {purchasingItem.category}</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-400">₹{purchasingItem.priceInRupees}</span>
                  </div>
                </div>

                {/* Simulated UPI QR & Details */}
                <div className="text-center space-y-3 py-2 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 rounded-xl border border-emerald-500/20">
                  <div className="inline-block p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                    {/* Simulated SVG QR Code */}
                    <svg className="size-32" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="30" height="30" fill="black" />
                      <rect x="15" y="15" width="20" height="20" fill="white" />
                      <rect x="20" y="20" width="10" height="10" fill="black" />
                      
                      <rect x="60" y="10" width="30" height="30" fill="black" />
                      <rect x="65" y="15" width="20" height="20" fill="white" />
                      <rect x="70" y="20" width="10" height="10" fill="black" />

                      <rect x="10" y="60" width="30" height="30" fill="black" />
                      <rect x="15" y="65" width="20" height="20" fill="white" />
                      <rect x="20" y="70" width="10" height="10" fill="black" />

                      <circle cx="50" cy="50" r="8" fill="#10B981" />
                      <rect x="50" y="20" width="8" height="15" fill="black" />
                      <rect x="65" y="60" width="12" height="12" fill="black" />
                      <rect x="80" y="75" width="10" height="10" fill="black" />
                      <rect x="55" y="80" width="10" height="10" fill="black" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">Scan with GPay, PhonePe, Paytm, or BHIM</p>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-1 text-xs font-mono font-bold text-foreground">
                      <span>abhiiterates@upi</span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* UTR Reference Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>UPI UTR / Transaction Ref ID *</span>
                    <span className="text-[10px] text-muted-foreground">12-digit number</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 429182039102"
                    value={upiRefInput}
                    onChange={(e) => setUpiRefInput(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Enter the UTR reference number generated by your UPI app after paying ₹{purchasingItem.priceInRupees}.
                  </p>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={upiMutation.isPending || !upiRefInput.trim()}
                    className="w-full text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {upiMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Verifying Payment…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        Verify Payment & Unlock Notes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
                <div className="space-y-0.5">
                  <Badge variant="outline" className={`text-[9px] ${getCategoryColor(viewingItem.category)}`}>
                    {viewingItem.category}
                  </Badge>
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{viewingItem.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a href={viewingItem.fileUrl} target="_blank" rel="noreferrer" download>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Download className="size-3.5" />
                      Download PDF
                    </Button>
                  </a>
                  <button
                    onClick={() => setViewingItem(null)}
                    className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Document Frame */}
              <div className="flex-1 bg-slate-950 p-2 flex flex-col items-center justify-center overflow-hidden">
                <iframe
                  src={viewingItem.fileUrl}
                  title={viewingItem.title}
                  className="w-full h-full rounded-lg border border-slate-800 bg-white"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
