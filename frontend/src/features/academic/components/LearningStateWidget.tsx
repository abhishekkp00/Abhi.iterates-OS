import { useEffect, useState } from 'react'
import { academicApi } from '../api/academic.api'
import type { LearningStateResult, SubjectLearningStateSummary } from '@/types/academic'
import { Brain, TrendingUp, TrendingDown, Activity, Info, RefreshCw } from '@/lib/icons'

interface LearningStateWidgetProps {
  subjectId?: string
}

export function LearningStateWidget({ subjectId }: LearningStateWidgetProps) {
  const [topicStates, setTopicStates] = useState<LearningStateResult[]>([])
  const [summary, setSummary] = useState<SubjectLearningStateSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTopicState, setSelectedTopicState] = useState<LearningStateResult | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (subjectId) {
        const sumRes = await academicApi.getSubjectLearningStateSummary(subjectId)
        setSummary(sumRes)
        setTopicStates(sumRes.topicResults || [])
        if (sumRes.topicResults && sumRes.topicResults.length > 0) {
          setSelectedTopicState(sumRes.topicResults[0] || null)
        }
      } else {
        const topicsRes = await academicApi.getUserTopicsLearningState()
        setTopicStates(topicsRes)
        if (topicsRes.length > 0) {
          setSelectedTopicState(topicsRes[0] || null)
        }
      }
    } catch (e) {
      // Handled gracefully
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [subjectId])

  if (isLoading && topicStates.length === 0) {
    return (
      <div className="p-5 border border-border/60 rounded-xl bg-card text-center text-xs text-muted-foreground">
        Analyzing academic evidence...
      </div>
    )
  }

  if (topicStates.length === 0) {
    return null
  }

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'STRONG':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'DEVELOPING':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'WEAK':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border/40'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="size-3 text-emerald-500 inline mr-1" />
      case 'DECLINING':
        return <TrendingDown className="size-3 text-destructive inline mr-1" />
      default:
        return <Activity className="size-3 text-muted-foreground inline mr-1" />
    }
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Topic Learning State Analysis</h3>
        </div>
        <button
          onClick={loadData}
          className="text-muted-foreground hover:text-foreground text-xs p-1 transition-colors"
          title="Refresh Analysis"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* SUBJECT LEVEL AGGREGATE SUMMARY (IF AVAILABLE) */}
      {summary && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs border-b border-border/50 pb-3">
          <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
            <span className="text-[10px] text-muted-foreground uppercase block">Strong</span>
            <span className="text-base font-bold font-mono text-emerald-600">{summary.strongCount}</span>
          </div>
          <div className="bg-blue-500/5 p-2 rounded border border-blue-500/10">
            <span className="text-[10px] text-muted-foreground uppercase block">Developing</span>
            <span className="text-base font-bold font-mono text-blue-600">{summary.developingCount}</span>
          </div>
          <div className="bg-amber-500/5 p-2 rounded border border-amber-500/10">
            <span className="text-[10px] text-muted-foreground uppercase block">Weak</span>
            <span className="text-base font-bold font-mono text-amber-600">{summary.weakCount}</span>
          </div>
          <div className="bg-muted/40 p-2 rounded border border-border/40">
            <span className="text-[10px] text-muted-foreground uppercase block">No Data</span>
            <span className="text-base font-bold font-mono text-muted-foreground">{summary.insufficientDataCount}</span>
          </div>
        </div>
      )}

      {/* TOPIC SELECTION PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {topicStates.map((t) => {
          const isSelected = selectedTopicState?.topicId === t.topicId

          return (
            <button
              key={t.topicId}
              onClick={() => setSelectedTopicState(t)}
              className={`px-2.5 py-1 rounded-md border shrink-0 transition-all font-medium ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-accent'
              }`}
            >
              {t.topicName}
            </button>
          )
        })}
      </div>

      {/* SELECTED TOPIC DETAILED ANALYSIS CARD */}
      {selectedTopicState && (
        <div className="p-4 rounded-lg border border-border/60 bg-muted/20 space-y-4 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                {selectedTopicState.subjectName}
              </span>
              <h4 className="text-sm font-bold text-foreground">{selectedTopicState.topicName}</h4>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStateBadge(
                  selectedTopicState.state
                )}`}
              >
                {selectedTopicState.state.replace('_', ' ')}
              </span>

              <span className="px-2 py-0.5 rounded bg-muted border border-border/40 text-[11px] font-medium text-muted-foreground flex items-center">
                {getTrendIcon(selectedTopicState.trend)}
                {selectedTopicState.trend}
              </span>
            </div>
          </div>

          {/* FACTUAL METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center border-y border-border/40 py-3">
            <div>
              <span className="text-[10px] text-muted-foreground block">Recent Test Score</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {selectedTopicState.recentAveragePercentage != null
                  ? `${selectedTopicState.recentAveragePercentage}%`
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Historical Avg</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {selectedTopicState.historicalAveragePercentage != null
                  ? `${selectedTopicState.historicalAveragePercentage}%`
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Study Time Context</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {selectedTopicState.totalStudyMinutes} mins
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Data Evidence Level</span>
              <span className="text-sm font-bold font-mono text-primary">
                {selectedTopicState.evidenceLevel} ({selectedTopicState.assessmentAttemptCount} Tests)
              </span>
            </div>
          </div>

          {/* DETERMINISTIC EXPLANATION REASON */}
          <div className="flex items-start gap-2 bg-background p-3 rounded-md border border-border/40 text-muted-foreground text-[11px] leading-relaxed">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground mr-1">Evidence Rationale:</span>
              <span>{selectedTopicState.reason}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
