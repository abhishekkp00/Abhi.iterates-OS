import { useState } from 'react'
import {
  Wrench,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  ShoppingBag,
  FileText,
  User,
  LayoutDashboard,
  Code
} from 'lucide-react'
import type { ToolExecution } from '@/types/ai'

interface ToolTimelineProps {
  executions?: ToolExecution[]
}

export function ToolTimeline({ executions }: ToolTimelineProps) {
  if (!executions || executions.length === 0) return null

  return (
    <div className="my-3 space-y-2 border-l-2 border-muted pl-4 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        <Wrench className="h-3 w-3" />
        <span>Agent Tool Calls</span>
      </div>
      {executions.map((exe, idx) => (
        <ToolExecutionItem key={idx} execution={exe} />
      ))}
    </div>
  )
}

function ToolExecutionItem({ execution }: { execution: ToolExecution }) {
  const [isOpen, setIsOpen] = useState(false)

  // Map tool name to icon
  const getToolIcon = (name: string) => {
    switch (name) {
      case 'searchResources':
        return <Database className="h-3.5 w-3.5" />
      case 'searchMarketplace':
        return <ShoppingBag className="h-3.5 w-3.5" />
      case 'searchKnowledgeBase':
        return <FileText className="h-3.5 w-3.5" />
      case 'getCurrentProfile':
        return <User className="h-3.5 w-3.5" />
      case 'getDashboardSummary':
        return <LayoutDashboard className="h-3.5 w-3.5" />
      default:
        return <Wrench className="h-3.5 w-3.5" />
    }
  }

  // Format tool name to human-friendly text
  const getFriendlyName = (name: string) => {
    switch (name) {
      case 'searchResources':
        return 'Searching study resources'
      case 'searchMarketplace':
        return 'Scanning student marketplace'
      case 'searchKnowledgeBase':
        return 'Searching knowledge base RAG files'
      case 'getCurrentProfile':
        return 'Retrieving student profile details'
      case 'getDashboardSummary':
        return 'Assembling dashboard summary stats'
      default:
        return name
    }
  }

  const formatJson = (str?: string) => {
    if (!str) return ''
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  const isRunning = execution.status === 'running'
  const isCompleted = execution.status === 'completed'

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 text-xs shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors duration-150"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Wrench className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            {getToolIcon(execution.name)}
            {getFriendlyName(execution.name)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-[10px] uppercase font-semibold">
            {execution.status}
          </span>
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      </div>

      {/* Collapsible Details */}
      {isOpen && (
        <div className="border-t border-border/40 bg-muted/10 px-3 py-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
          <div>
            <span className="font-semibold text-muted-foreground block mb-0.5 uppercase text-[9px] tracking-wider flex items-center gap-1">
              <Code className="h-2.5 w-2.5" /> Input Parameters
            </span>
            <pre className="p-2 bg-muted/40 rounded border border-border/30 overflow-x-auto text-[10px] font-mono text-foreground/80 max-h-32">
              {formatJson(execution.arguments)}
            </pre>
          </div>
          {execution.result && (
            <div>
              <span className="font-semibold text-muted-foreground block mb-0.5 uppercase text-[9px] tracking-wider flex items-center gap-1">
                <Database className="h-2.5 w-2.5" /> Output Results
              </span>
              <pre className="p-2 bg-muted/40 rounded border border-border/30 overflow-x-auto text-[10px] font-mono text-foreground/80 max-h-48">
                {formatJson(execution.result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
