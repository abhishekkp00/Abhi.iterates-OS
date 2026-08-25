export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'TRUE_FALSE'

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED'

export interface Assessment {
  id: string
  userId: string
  subjectId?: string
  subjectName?: string
  title: string
  description?: string
  status: AssessmentStatus
  questionCount: number
  durationMinutes?: number
  topicIds?: string[]
  createdAt: string
  updatedAt?: string
}

export interface QuestionOption {
  id: string
  optionText: string
  optionOrder: number
  // NOTE: isCorrect IS NEVER RETURNED TO THE STUDENT BEFORE SUBMISSION FOR SECURITY!
}

export interface QuestionOptionOwner extends QuestionOption {
  isCorrect: boolean
}

export interface Question {
  id: string
  assessmentId: string
  topicId?: string
  topicName?: string
  questionText: string
  questionType: QuestionType
  difficulty: QuestionDifficulty
  marks: number
  questionOrder: number
  options: QuestionOption[]
  createdAt?: string
}

export interface AnswerResult {
  questionId: string
  questionText: string
  selectedOptionId?: string
  selectedOptionText?: string
  isCorrect: boolean
  marksAwarded: number
  questionMarks: number
}

export interface AssessmentAttempt {
  id: string
  userId: string
  assessmentId: string
  assessmentTitle: string
  startedAt: string
  submittedAt?: string
  status: AttemptStatus
  totalMarks: number
  obtainedMarks: number
  percentage: number
  totalQuestions?: number
  correctAnswersCount?: number
  answerResults?: AnswerResult[]
  createdAt?: string
}

export interface TopicPerformance {
  topicId: string
  topicName: string
  subjectId?: string
  subjectName?: string
  totalAttempts: number
  totalQuestionsAttempted: number
  totalQuestionsCorrect: number
  totalMarksObtained: number
  totalMarksAvailable: number
  averagePercentage: number
  latestPercentage: number
  lastEvaluatedAt?: string
}

export interface CreateAssessmentPayload {
  title: string
  description?: string
  subjectId?: string
  topicIds?: string[]
  durationMinutes?: number
}

export interface CreateQuestionOptionPayload {
  optionText: string
  optionOrder: number
  isCorrect: boolean
}

export interface CreateQuestionPayload {
  topicId?: string
  questionText: string
  questionType?: QuestionType
  difficulty?: QuestionDifficulty
  marks?: number
  questionOrder: number
  options: CreateQuestionOptionPayload[]
}

export interface StudentAnswerPayload {
  questionId: string
  selectedOptionId: string
}

export interface SubmitAttemptPayload {
  answers: StudentAnswerPayload[]
}
