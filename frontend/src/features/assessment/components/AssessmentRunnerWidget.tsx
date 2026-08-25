import { useState } from 'react'
import { useAssessmentStore } from '../store/assessment.store'
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Send, RotateCcw, Award } from '@/lib/icons'

interface AssessmentRunnerWidgetProps {
  assessmentId: string
  onClose?: () => void
}

export function AssessmentRunnerWidget({ assessmentId, onClose }: AssessmentRunnerWidgetProps) {
  const {
    activeAssessment,
    questions,
    activeAttempt,
    submittedResult,
    selectedAnswers,
    isLoading,
    selectAnswer,
    startAttempt,
    submitAttempt,
    resetRunner,
  } = useAssessmentStore()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const handleStartAttempt = async () => {
    try {
      await startAttempt(assessmentId)
    } catch (e) {
      // Error handled by store
    }
  }

  const handleSubmitAttempt = async () => {
    try {
      await submitAttempt()
    } catch (e) {
      // Error handled by store
    }
  }

  if (!activeAssessment) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        Loading assessment package...
      </div>
    )
  }

  // RESULT SCREEN AFTER SUBMISSION
  if (submittedResult) {
    const isPassed = submittedResult.percentage >= 50.0

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-md space-y-6 max-w-2xl mx-auto animate-in fade-in-0">
        <div className="text-center space-y-2 border-b border-border/60 pb-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-1">
            <Award className="size-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{submittedResult.assessmentTitle}</h2>
          <p className="text-xs text-muted-foreground">Official Assessment Evaluation Report</p>
        </div>

        {/* FACTUAL SCORE BOARD */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
            <span className="text-xs text-muted-foreground block mb-0.5">Obtained Score</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {submittedResult.obtainedMarks} / {submittedResult.totalMarks}
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
            <span className="text-xs text-muted-foreground block mb-0.5">Percentage</span>
            <span className={`text-xl font-bold font-mono ${isPassed ? 'text-emerald-500' : 'text-amber-500'}`}>
              {submittedResult.percentage}%
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
            <span className="text-xs text-muted-foreground block mb-0.5">Correct Questions</span>
            <span className="text-xl font-bold font-mono text-foreground">
              {submittedResult.correctAnswersCount} / {submittedResult.totalQuestions}
            </span>
          </div>
        </div>

        {/* DETAILED QUESTION BREAKDOWN */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evaluation Breakdown
          </h4>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {submittedResult.answerResults?.map((ans, idx) => (
              <div
                key={ans.questionId}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {ans.isCorrect ? (
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium text-foreground">
                      {idx + 1}. {ans.questionText}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    {ans.marksAwarded} / {ans.questionMarks} pts
                  </span>
                </div>

                <div className="pl-6 text-muted-foreground">
                  <span>Selected: </span>
                  <span className="font-semibold text-foreground">
                    {ans.selectedOptionText || 'Unanswered'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
          <button
            onClick={() => {
              resetRunner()
              if (onClose) onClose()
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>Close & Return</span>
          </button>
        </div>
      </div>
    )
  }

  // START ATTEMPT SCREEN
  if (!activeAttempt) {
    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-md max-w-lg mx-auto text-center space-y-4">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{activeAssessment.title}</h3>
        {activeAssessment.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{activeAssessment.description}</p>
        )}

        <div className="flex items-center justify-center gap-6 py-2 text-xs text-muted-foreground border-y border-border/50">
          <div>
            <span className="block font-semibold text-foreground text-sm">{questions.length}</span>
            <span>Questions</span>
          </div>
          <div>
            <span className="block font-semibold text-foreground text-sm">
              {activeAssessment.durationMinutes ? `${activeAssessment.durationMinutes} mins` : 'Untimed'}
            </span>
            <span>Duration</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleStartAttempt}
            disabled={isLoading || questions.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="size-3.5" />
            <span>Begin Assessment Attempt</span>
          </button>
        </div>
      </div>
    )
  }

  // ACTIVE QUESTION RUNNER
  const currentQuestion = questions[currentQuestionIndex]
  if (!currentQuestion) return null

  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const selectedOptId = selectedAnswers[currentQuestion.id]

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-md space-y-6 max-w-2xl mx-auto">
      {/* RUNNER HEADER */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <h4 className="text-sm font-semibold text-foreground truncate max-w-md">{activeAssessment.title}</h4>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            {currentQuestion.marks} pts
          </span>
        </div>
      </div>

      {/* QUESTION TEXT */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground leading-relaxed">{currentQuestion.questionText}</h3>

        {/* MCQ OPTIONS LIST (NO CORRECT ANSWER HINT SHOWN BEFORE SUBMISSION!) */}
        <div className="space-y-2">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOptId === opt.id

            return (
              <label
                key={opt.id}
                onClick={() => selectAnswer(currentQuestion.id, opt.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-foreground font-medium shadow-sm'
                    : 'bg-muted/30 border-border/60 hover:bg-accent text-muted-foreground'
                }`}
              >
                <input
                  type="radio"
                  name={`question_${currentQuestion.id}`}
                  checked={isSelected}
                  onChange={() => selectAnswer(currentQuestion.id, opt.id)}
                  className="size-4 text-primary focus:ring-primary"
                />
                <span className="flex-1 leading-relaxed">{opt.optionText}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* RUNNER FOOTER NAVIGATION */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <button
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
          <span>Previous</span>
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmitAttempt}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold shadow-sm transition-colors"
          >
            <Send className="size-3.5" />
            <span>Submit Assessment</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
