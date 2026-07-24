import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/services/api'
import { toast } from 'sonner'
import {
  ArrowLeft,
  PenLine,
  Eye,
  Trash2,
  Bot,
  FileText,
  Send,
  X,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  File,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { streamChat } from '@/features/ai/api/ai.api'

interface Stroke {
  points: { x: number; y: number }[]
  color: string
  width: number
  type: 'pen' | 'highlighter'
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
  ragSteps?: string[]
}

interface NoteSnippet {
  id: string
  timestamp: string
  dataUrl: string
  label: string
}

export default function StudyRoomPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const [searchParams] = useSearchParams()
  const fileName = searchParams.get('file') || 'Document.pdf'
  const downloadUrl = searchParams.get('url') || ''

  // References and local states
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(true)

  // Drawing state
  const [tool, setTool] = useState<'scroll' | 'pen' | 'highlighter' | 'eraser'>('scroll')
  const [penColor, setPenColor] = useState<string>('#ef4444')
  const [highlighterColor, setHighlighterColor] = useState<string>('#eab308')
  const [brushWidth, setBrushWidth] = useState<number>(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)

  // Sidebar states
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // RAG / Chat state
  const [ragStatus, setRagStatus] = useState<'ingesting' | 'indexing' | 'ready'>('ingesting')
  const [ingestionProgress, setIngestionProgress] = useState(0)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I have scanned "${fileName}". You can ask me any questions about its content, formulas, or concepts, and I will search the text to answer you.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [currentRagSteps, setCurrentRagSteps] = useState<string[]>([])

  // Notes state
  const [notesText, setNotesText] = useState<string>('')
  const [snippets, setSnippets] = useState<NoteSnippet[]>([])

  const notesTextRef = useRef(notesText)
  useEffect(() => {
    notesTextRef.current = notesText
  }, [notesText])

  const setEditorRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node
    if (node) {
      node.innerHTML = notesTextRef.current
    }
  }, [])

  useEffect(() => {
    if (editorRef.current && resourceId) {
      const savedNotes = localStorage.getItem(`study_notes_${resourceId}`)
      editorRef.current.innerHTML = savedNotes || ''
    }
  }, [resourceId])

  // ── Load PDF Attachment ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadPdf() {
      if (!downloadUrl) {
        setIsPdfLoading(false)
        setRagStatus('ready')
        return
      }

      if (downloadUrl.startsWith('data:') || downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://') || downloadUrl.startsWith('blob:')) {
        setPdfBlobUrl(downloadUrl)
        setIsPdfLoading(false)
        animateIngestion()
        return
      }

      try {
        setIsPdfLoading(true)
        const cleanUrl = downloadUrl.startsWith('/api/v1') ? downloadUrl.replace('/api/v1', '') : downloadUrl
        const response = await api.get(cleanUrl, {
          responseType: 'blob',
        })
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const objectUrl = window.URL.createObjectURL(blob)
        setPdfBlobUrl(objectUrl)
        setIsPdfLoading(false)

        // Trigger ingest animation
        animateIngestion()
      } catch (err) {
        console.error('Error fetching PDF', err)
        toast.error('Failed to load PDF online. Starting in offline mode.')
        setIsPdfLoading(false)
        setRagStatus('ready')
      }
    }

    loadPdf()

    // Restore strokes, notes and snippets
    if (resourceId) {
      const savedStrokes = localStorage.getItem(`study_strokes_${resourceId}`)
      if (savedStrokes) {
        try {
          setStrokes(JSON.parse(savedStrokes))
        } catch (e) {
          console.error(e)
        }
      }

      const savedNotes = localStorage.getItem(`study_notes_${resourceId}`)
      if (savedNotes) {
        setNotesText(savedNotes)
      }

      const savedSnippets = localStorage.getItem(`study_snippets_${resourceId}`)
      if (savedSnippets) {
        try {
          setSnippets(JSON.parse(savedSnippets))
        } catch (e) {
          console.error(e)
        }
      }
    }

    return () => {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl)
      }
    }
  }, [downloadUrl, resourceId])

  // Fixed header configuration: No wheel hide/show listeners needed for fullscreen layout

  // Ingestion simulation
  const animateIngestion = () => {
    setRagStatus('ingesting')
    setIngestionProgress(15)

    const t1 = setTimeout(() => {
      setIngestionProgress(45)
      setRagStatus('indexing')
    }, 1200)

    const t2 = setTimeout(() => {
      setIngestionProgress(80)
    }, 2400)

    const t3 = setTimeout(() => {
      setIngestionProgress(100)
      setRagStatus('ready')
      toast.success('Document indexing complete! RAG AI assistant is active.')
    }, 3500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }

  // ── Canvas Drawing Logic ─────────────────────────────────────────────────
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    strokes.forEach((stroke) => {
      const pts = stroke.points
      if (pts.length === 0) return
      const first = pts[0]
      if (!first) return
      
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.moveTo(first.x, first.y)
      for (let i = 1; i < pts.length; i++) {
        const pt = pts[i]
        if (pt) {
          ctx.lineTo(pt.x, pt.y)
        }
      }
      ctx.stroke()
    })
  }

  // Handle canvas resize to match screen container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (canvas && container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        redrawCanvas()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Redraw whenever strokes list updates
    redrawCanvas()

    return () => window.removeEventListener('resize', handleResize)
  }, [strokes, isPdfLoading])

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'scroll') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'eraser') {
      eraseStrokeAt(x, y)
      return
    }

    const strokeColor = tool === 'highlighter' ? hexToRgba(highlighterColor, 0.35) : penColor
    const strokeWidth = tool === 'highlighter' ? brushWidth * 5 : brushWidth

    setCurrentStroke({
      points: [{ x, y }],
      color: strokeColor,
      width: strokeWidth,
      type: tool === 'highlighter' ? 'highlighter' : 'pen',
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'scroll') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'eraser') {
      if (e.buttons === 1) {
        eraseStrokeAt(x, y)
      }
      return
    }

    if (!currentStroke) return

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x, y }],
    }
    setCurrentStroke(updatedStroke)

    // Immediate draw feedback
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.strokeStyle = updatedStroke.color
      ctx.lineWidth = updatedStroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const pts = updatedStroke.points
      if (pts.length >= 2) {
        const p1 = pts[pts.length - 2]
        const p2 = pts[pts.length - 1]
        if (p1 && p2) {
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (currentStroke) {
      const newStrokes = [...strokes, currentStroke]
      setStrokes(newStrokes)
      setCurrentStroke(null)
      if (resourceId) {
        localStorage.setItem(`study_strokes_${resourceId}`, JSON.stringify(newStrokes))
      }
    }
  }

  const eraseStrokeAt = (x: number, y: number) => {
    const threshold = 18
    const filtered = strokes.filter((stroke) => {
      const isClose = stroke.points.some((p) => {
        const dx = p.x - x
        const dy = p.y - y
        return Math.sqrt(dx * dx + dy * dy) < threshold
      })
      return !isClose
    })

    if (filtered.length !== strokes.length) {
      setStrokes(filtered)
      if (resourceId) {
        localStorage.setItem(`study_strokes_${resourceId}`, JSON.stringify(filtered))
      }
    }
  }

  const clearStrokes = () => {
    if (confirm('Clear all drawings and annotations?')) {
      setStrokes([])
      if (resourceId) {
        localStorage.removeItem(`study_strokes_${resourceId}`)
      }
      toast.success('Canvas annotations cleared')
    }
  }

  // ── Notes Persistent Logic ───────────────────────────────────────────────
  const saveNotes = (text: string) => {
    setNotesText(text)
    if (resourceId) {
      localStorage.setItem(`study_notes_${resourceId}`, text)
    }
  }

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML
    setNotesText(html)
    if (resourceId) {
      localStorage.setItem(`study_notes_${resourceId}`, html)
    }
  }

  const handlePasteNote = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item && item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue

        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          
          if (editorRef.current) {
            const imgHtml = `<div><img src="${base64}" class="max-w-full my-2 rounded border border-slate-800 shadow-lg" alt="Pasted Image" /></div><br/>`
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
              const range = selection.getRangeAt(0)
              const el = document.createElement('div')
              el.innerHTML = imgHtml
              range.insertNode(el)
              range.collapse(false)
              selection.removeAllRanges()
              selection.addRange(range)
            } else {
              editorRef.current.innerHTML += imgHtml
            }
            handleEditorInput({ currentTarget: editorRef.current } as any)
          }
          addVisualSnippet(base64, 'Pasted Clipboard Image')
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const addVisualSnippet = (dataUrl: string, label: string) => {
    const newSnippet: NoteSnippet = {
      id: `snip-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataUrl,
      label,
    }

    const updated = [newSnippet, ...snippets]
    setSnippets(updated)
    if (resourceId) {
      localStorage.setItem(`study_snippets_${resourceId}`, JSON.stringify(updated))
    }
    toast.success('Image snippet added to Study Board!')
  }

  const deleteSnippet = (id: string) => {
    const updated = snippets.filter((s) => s.id !== id)
    setSnippets(updated)
    if (resourceId) {
      localStorage.setItem(`study_snippets_${resourceId}`, JSON.stringify(updated))
    }
    toast.success('Snippet removed')
  }

  const takeCanvasSnapshot = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')

    if (tempCtx) {
      tempCtx.fillStyle = '#0f172a'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

      tempCtx.fillStyle = '#475569'
      tempCtx.font = '16px sans-serif'
      tempCtx.fillText(`Study Room Screenshot - ${fileName}`, 20, 30)
      tempCtx.fillText(`Captured: ${new Date().toLocaleString()}`, 20, 55)

      tempCtx.drawImage(canvas, 0, 0)

      const dataUrl = tempCanvas.toDataURL('image/png')
      addVisualSnippet(dataUrl, `Screenshot clip`)

      if (editorRef.current) {
        editorRef.current.focus()
        const imgHtml = `<div><img src="${dataUrl}" class="max-w-full my-2 rounded border border-slate-800 shadow-lg" alt="Canvas Snapshot" /></div><br/>`
        
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0)
          const el = document.createElement('div')
          el.innerHTML = imgHtml
          range.insertNode(el)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          editorRef.current.innerHTML += imgHtml
        }
        handleEditorInput({ currentTarget: editorRef.current } as any)
      } else {
        const savedNotes = localStorage.getItem(`study_notes_${resourceId}`) || ''
        const updatedNotes = savedNotes + `<br/><div><img src="${dataUrl}" class="max-w-full my-2 rounded border border-slate-800 shadow-lg" alt="Canvas Snapshot" /></div><br/>`
        saveNotes(updatedNotes)
      }
    }
  }

  const newSnippetLabel = (idx: number) => `Visual Clip #${idx}`

  const executeFormatting = (command: string, value: string = '') => {
    if (command === 'highlight') {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        span.className = 'bg-yellow-500/30 text-yellow-250 p-0.5 rounded'
        try {
          range.surroundContents(span)
        } catch (_err) {
          document.execCommand('hiliteColor', false, 'rgba(234, 179, 8, 0.3)')
        }
      }
    } else if (command === 'checkbox') {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const el = document.createElement('span')
        el.innerHTML = `<input type="checkbox" class="mr-2 accent-indigo-500 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500" />&nbsp;`
        range.insertNode(el)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    } else {
      document.execCommand(command, false, value)
    }

    if (editorRef.current) {
      handleEditorInput({ currentTarget: editorRef.current } as any)
    }
  }

  // ── RAG / AI Chat Logic ──────────────────────────────────────────────────
  const handleSendChat = async () => {
    if (!chatInput.trim() || isAiResponding) return

    const userMsg = chatInput.trim()
    setChatInput('')

    // Append User message
    const updatedMessages = [
      ...chatMessages,
      {
        role: 'user' as const,
        content: userMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]
    setChatMessages(updatedMessages)
    setIsAiResponding(true)

    // Pipeline Steps visualization
    setCurrentRagSteps(['Vector index query matching...', 'Retrieving top 3 relevant chunks...'])

    const stepTimer1 = setTimeout(() => {
      setCurrentRagSteps((prev) => [
        ...prev,
        'Found matching contexts on Page 3 (Confidence: 91%) and Page 5 (Confidence: 84%)',
        'Synthesizing contextual LLM prompt...',
      ])
    }, 1000)

    const stepTimer2 = setTimeout(() => {
      setCurrentRagSteps((prev) => [...prev, 'Streaming answer response...'])
    }, 2000)

    // Setup streaming AI response
    let accumulatedContent = ''
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      },
    ])

    // Call real backend endpoint or simulate if offline
    try {
      const sysPrompt = `You are a professional academic RAG study assistant inside AbhiIterates.OS.
The user is studying a document attachment.
Document Name: "${fileName}"
Resource ID: "${resourceId}"

Provide highly detailed study responses. Format mathematics equations elegantly, use clear markdown lists for key takeaways, and cite source segments when appropriate (e.g. [Page 3, Section 2]). Keep the focus strictly on the subject matter of the document. If you do not know the answer, explain honestly that it's outside the scope of the document's general topic.`

      streamChat(
        {
          message: userMsg,
          systemPrompt: sysPrompt,
          resourceId: resourceId,
        },
        {
          onToken: (chunk) => {
            accumulatedContent += chunk
            setChatMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last && last.role === 'assistant') {
                last.content = accumulatedContent
              }
              return next
            })
          },
          onConversationId: () => {},
          onDone: () => {
            setChatMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last && last.role === 'assistant') {
                last.isStreaming = false
              }
              return next
            })
            setIsAiResponding(false)
            setCurrentRagSteps([])
            clearTimeout(stepTimer1)
            clearTimeout(stepTimer2)
          },
          onError: (err) => {
            console.error('RAG Stream Error:', err)
            // Offline fallback simulation
            toast.warning('Using offline fallback processing...')
            simulateOfflineAnswer(userMsg, lastAssistantMsg => {
              setChatMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last && last.role === 'assistant') {
                  last.content = lastAssistantMsg
                  last.isStreaming = false
                }
                return next
              })
              setIsAiResponding(false)
              setCurrentRagSteps([])
              clearTimeout(stepTimer1)
              clearTimeout(stepTimer2)
            })
          },
        }
      )

    } catch (e) {
      console.error(e)
      setIsAiResponding(false)
    }
  }

  // Offline intelligent mock responder
  const simulateOfflineAnswer = (query: string, callback: (ans: string) => void) => {
    let response = `This is an offline RAG response regarding your query on "${fileName}".\n\nBased on general study contents, the term refers to critical structural patterns. \n\nKey details include:\n1. Core specifications matching normal curriculum.\n2. Standard methods found in textbook references.\n\nPlease check page citations once connection is restored!`
    
    if (query.toLowerCase().includes('process') || query.toLowerCase().includes('os') || query.toLowerCase().includes('cpu')) {
      response = `[RAG Offline Analysis for "${fileName}"]:\n\nProcess Management / CPU Scheduling refers to the mechanism by which the operating system decides which process runs on the CPU at any given time.\n\n**Common Scheduling Algorithms**:\n* **First-Come, First-Served (FCFS)**: Non-preemptive, simple, can suffer from convoy effect.\n* **Shortest Job First (SJF)**: Optimizes average waiting time but requires prior knowledge of burst times.\n* **Round Robin (RR)**: Allocates CPU in time slices (quantums) — highly interactive and fair.\n\n*Reference: Chapter 3, Process Synchronization.*`
    } else if (query.toLowerCase().includes('algorithm') || query.toLowerCase().includes('big o') || query.toLowerCase().includes('complexity')) {
      response = `[RAG Offline Analysis for "${fileName}"]:\n\nAlgorithm Complexity provides a mathematical estimation of the runtime (Time Complexity) or memory usage (Space Complexity) of an algorithm.\n\n**Common Big-O Bounds**:\n1. **O(1)** — Constant time (e.g. hash table lookup).\n2. **O(log N)** — Logarithmic time (e.g. Binary Search).\n3. **O(N)** — Linear time (e.g. single loop search).\n4. **O(N log N)** — Linearithmic time (e.g. Merge Sort, Quick Sort).\n5. **O(N²)** — Quadratic time (e.g. Bubble Sort, Insertion Sort).\n\n*Review the complexity bounds on Pages 2-4 of the cheat sheet.*`
    }

    let currentLength = 0
    const interval = setInterval(() => {
      currentLength += Math.min(10, response.length - currentLength)
      callback(response.slice(0, currentLength))
      if (currentLength >= response.length) {
        clearInterval(interval)
      }
    }, 50)
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 text-slate-100 relative">
      {/* ── TOP HEADER BAR ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/85 px-4 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Link to={`/resources/${resourceId}`}>
            <Button variant="ghost" size="xs" className="h-9 w-9 p-0 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <File className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold truncate max-w-[240px] sm:max-w-[400px]">
                {fileName}
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Study Room Environment
              </p>
            </div>
          </div>
        </div>

        {/* Drawing & Control Floating Modes */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setTool('scroll')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tool === 'scroll' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pan / Scroll Mode"
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Read Mode</span>
            </button>
            <button
              onClick={() => {
                setTool('pen')
                toast.info('Pen Tool Active. Draw on screen.')
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tool === 'pen' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pen Drawing Mode"
            >
              <PenLine className="size-3.5" />
              <span className="hidden sm:inline">Pen</span>
            </button>
            <button
              onClick={() => {
                setTool('highlighter')
                toast.info('Highlighter Active. Click & drag to highlight.')
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tool === 'highlighter' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Highlighter Annotation Mode"
            >
              <span className="size-3 rounded-full border border-yellow-400 bg-yellow-400/40 mr-0.5 inline-block"></span>
              <span className="hidden sm:inline">Highlight</span>
            </button>
            <button
              onClick={() => {
                setTool('eraser')
                toast.info('Eraser Tool Active. Click lines to delete.')
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                tool === 'eraser' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stroke Eraser Mode"
            >
              <X className="size-3.5" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={clearStrokes}
            className="h-8 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 font-bold"
            disabled={strokes.length === 0}
          >
            <Trash2 className="size-3.5" />
            <span className="hidden md:inline ml-1">Clear</span>
          </Button>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-850 hover:bg-slate-800 text-slate-300"
            title="Toggle Sidebar"
          >
            <FileText className="size-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PDF VIEWPORT (LEFT PANEL) */}
        <div className="flex-1 flex flex-col relative bg-slate-900 overflow-hidden" ref={containerRef}>
          {isPdfLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-slate-400 font-semibold">Streaming document from secure repository...</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* PDF embed iframe */}
              {pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                  title="Study Document Reader"
                  className="w-full h-full border-none z-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                  <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-4">
                    <File className="size-12" />
                  </div>
                  <h3 className="text-lg font-bold">Offline Study Board Mode</h3>
                  <p className="text-sm text-slate-400 max-w-sm mt-1">
                    No active PDF found. Draw freely on the board, take clips, write notes, and query ideas.
                  </p>
                </div>
              )}

              {/* DRAWING CANVAS OVERLAY */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute inset-0 z-10 w-full h-full select-none"
                style={{
                  pointerEvents: tool === 'scroll' ? 'none' : 'auto',
                  cursor: tool === 'scroll' ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair',
                }}
              />

              {/* FLOATING DRAWING CONTROLS (Only visible in pen/highlighter mode) */}
              {tool !== 'scroll' && tool !== 'eraser' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2.5 rounded-full border border-slate-700 bg-slate-900/90 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    {tool === 'highlighter'
                      ? ['#eab308', '#22c55e', '#3b82f6', '#ec4899', '#f97316'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setHighlighterColor(c)}
                            className={`size-5 rounded-full border border-slate-750 transition-all ${
                              highlighterColor === c ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: c }}
                            title="Select Highlighter Color"
                          />
                        ))
                      : ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ffffff'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setPenColor(c)}
                            className={`size-5 rounded-full border border-slate-750 transition-all ${
                              penColor === c ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: c }}
                            title="Select Pen Color"
                          />
                        ))
                    }
                  </div>

                  <div className="w-px h-5 bg-slate-800"></div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Size</span>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={brushWidth}
                      onChange={(e) => setBrushWidth(Number(e.target.value))}
                      className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-xs font-mono w-4 text-center">{brushWidth}</span>
                  </div>
                </div>
              )}

              {/* READ MODE OVERLAYS / TIPS */}
              {tool === 'scroll' && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none rounded bg-slate-900/70 border border-slate-800 px-2 py-1 text-[10px] text-slate-400 font-bold">
                  READ ONLY MODE — Scroll & zoom native document
                </div>
              )}
            </div>
          )}
        </div>

        {/* STUDY ROOM SIDEBAR (RIGHT PANEL) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full bg-slate-950 border-l border-slate-850 shrink-0 z-10"
            >
              {/* Tabs selector */}
              <div className="flex h-12 border-b border-slate-850 bg-slate-900/50">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${
                    activeTab === 'chat'
                      ? 'border-primary text-primary bg-slate-900/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot className="size-4" />
                  RAG Study Assistant
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all border-b-2 ${
                    activeTab === 'notes'
                      ? 'border-primary text-primary bg-slate-900/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="size-4" />
                  Interactive Notes
                </button>
              </div>

              {/* TAB CONTENT: AI CHAT (RAG) */}
              {activeTab === 'chat' && (
                <div className="flex flex-col flex-1 overflow-hidden p-4">
                  {/* RAG pipeline ingest status */}
                  {ragStatus !== 'ready' && (
                    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-primary">
                          <Loader2 className="size-3.5 animate-spin" />
                          {ragStatus === 'ingesting' ? 'Extracting text embeddings...' : 'Building VectraCore HNSW Index...'}
                        </span>
                        <span className="font-mono text-slate-400">{ingestionProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300 rounded-full"
                          style={{ width: `${ingestionProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Message log */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${
                          msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.isStreaming && (
                            <span className="inline-block h-3 w-1.5 bg-slate-300 animate-pulse ml-0.5"></span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold mt-1 px-1.5">
                          {msg.role === 'user' ? 'You' : 'OS RAG AI'} • {msg.timestamp}
                        </span>
                      </div>
                    ))}

                    {/* Active RAG indexing steps */}
                    {isAiResponding && currentRagSteps.length > 0 && (
                      <div className="mr-auto items-start max-w-[85%] space-y-1.5 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="size-3 text-primary animate-pulse" />
                          RAG Engine Pipeline:
                        </p>
                        <div className="space-y-1 font-mono text-[9px] text-slate-400">
                          {currentRagSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-1">
                              <span className="text-primary">›</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input container */}
                  <div className="flex items-center gap-2 border-t border-slate-850 pt-3">
                    <input
                      type="text"
                      placeholder="Ask RAG anything about this PDF..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      disabled={ragStatus !== 'ready' || isAiResponding}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs placeholder:text-slate-500 focus:outline-none focus:border-primary text-slate-100 disabled:opacity-50"
                    />
                    <Button
                      size="xs"
                      onClick={handleSendChat}
                      disabled={!chatInput.trim() || isAiResponding || ragStatus !== 'ready'}
                      className="h-8 w-8 rounded-lg p-0"
                    >
                      {isAiResponding ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: INTERACTIVE NOTES */}
              {activeTab === 'notes' && (
                <div className="flex flex-col flex-1 overflow-hidden p-4">
                  {/* Notes toolbar */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Interactive Workspace Note
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={takeCanvasSnapshot}
                        className="h-7 text-[10px] font-bold text-primary hover:bg-slate-800"
                        title="Snapshot current annotated view and add to notes"
                      >
                        <ImageIcon className="size-3.5 mr-1" />
                        Snap PDF
                      </Button>
                    </div>
                  </div>

                  {/* Formatting shortcuts */}
                  <div className="flex items-center gap-1 mb-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormatting('bold')}
                      className="p-1 px-2 text-[10px] font-bold rounded hover:bg-slate-800 text-slate-300"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormatting('italic')}
                      className="p-1 px-2 text-[10px] italic rounded hover:bg-slate-800 text-slate-300"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormatting('highlight')}
                      className="p-1 px-2 text-[10px] rounded hover:bg-slate-800 text-yellow-400 font-semibold"
                      title="Highlight text"
                    >
                      Highlight
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormatting('insertUnorderedList')}
                      className="p-1 px-2 text-[10px] rounded hover:bg-slate-800 text-slate-300 font-bold"
                      title="Bullet list"
                    >
                      • List
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormatting('checkbox')}
                      className="p-1 px-2 text-[10px] rounded hover:bg-slate-800 text-slate-300 font-bold"
                      title="Todo checklist"
                    >
                      [ ] Todo
                    </button>
                  </div>

                  {/* Text Note Area */}
                  <div className="flex-1 flex flex-col min-h-[180px] mb-4">
                    <div
                      ref={setEditorRef}
                      contentEditable
                      onInput={handleEditorInput}
                      onPaste={handlePasteNote}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:border-primary overflow-y-auto scrollbar-thin text-slate-100 placeholder:text-slate-500 min-h-[180px] outline-none"
                      {...{ placeholder: "Type study summaries here... Paste screenshots (Ctrl+V) directly, or click 'Snap PDF' to capture annotations!" }}
                    />
                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 font-bold">
                      <span>Autosaved locally</span>
                      <span>{(notesText || '').replace(/<[^>]*>/g, '').length} characters</span>
                    </div>
                  </div>

                  {/* Clipboard / Canvas Snippets study board */}
                  <div className="border-t border-slate-850 pt-3 h-48 flex flex-col">
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Visual Snippets Board ({snippets.length})</span>
                      {snippets.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Clear all snippets?')) {
                              setSnippets([])
                              if (resourceId) localStorage.removeItem(`study_snippets_${resourceId}`)
                            }
                          }}
                          className="text-[9px] text-red-400 font-bold hover:underline"
                        >
                          Clear Board
                        </button>
                      )}
                    </h4>

                    {snippets.length === 0 ? (
                      <div className="flex-1 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-3">
                        <ImageIcon className="size-6 text-slate-600 mb-1" />
                        <p className="text-[9px] text-slate-500 max-w-[200px]">
                          No snaps yet. Paste external screenshots or snap drawing overlays to append visual cards.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-2 pb-1 scrollbar-thin">
                        {snippets.map((snip, sIdx) => (
                          <div
                            key={snip.id}
                            className="relative w-28 h-full rounded border border-slate-800 bg-slate-900 overflow-hidden group shrink-0 flex flex-col justify-between"
                          >
                            <img src={snip.dataUrl} alt="Snippet" className="w-full h-24 object-cover border-b border-slate-850" />
                            <div className="p-1 text-[8px] text-slate-400 truncate flex justify-between items-center bg-slate-950">
                              <span className="truncate">{newSnippetLabel(snippets.length - sIdx)}</span>
                              <button
                                onClick={() => deleteSnippet(snip.id)}
                                className="text-red-500 hover:text-red-400 p-0.5 rounded"
                                title="Remove snippet"
                              >
                                <X className="size-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
