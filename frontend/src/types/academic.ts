export type StudySessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type StudySessionType =
  | 'STUDY'
  | 'REVISION'
  | 'PRACTICE'
  | 'READING'
  | 'VIDEO'
  | 'ASSIGNMENT'
  | 'MOCK_TEST'

export type LearningState = 'STRONG' | 'DEVELOPING' | 'WEAK' | 'INSUFFICIENT_DATA'

export type LearningTrend = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA'

export type EvidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface AcademicSubject {
  id: string
  name: string
  code?: string
  color?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface AcademicTopic {
  id: string
  subjectId: string
  subjectName?: string
  name: string
  description?: string
  orderIndex?: number
  createdAt?: string
  updatedAt?: string
}

export interface StudySession {
  id: string
  userId: string
  topicId: string
  topicName?: string
  subjectId?: string
  subjectName?: string
  startedAt: string
  endedAt?: string
  durationMinutes?: number
  status: StudySessionStatus
  sessionType: StudySessionType
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface TopicProgress {
  id?: string
  topicId: string
  topicName?: string
  subjectId?: string
  subjectName?: string
  totalStudyMinutes: number
  sessionCount: number
  averageSessionMinutes: number
  lastStudiedAt?: string
  updatedAt?: string
}

export interface LearningStateResult {
  topicId: string
  topicName: string
  subjectId: string
  subjectName: string
  state: LearningState
  trend: LearningTrend
  recentAveragePercentage?: number
  historicalAveragePercentage?: number
  assessmentAttemptCount: number
  totalStudyMinutes: number
  studySessionCount: number
  lastStudiedAt?: string
  lastAssessmentAt?: string
  daysSinceLastStudied?: number
  daysSinceLastAssessment?: number
  evidenceLevel: EvidenceLevel
  reason: string
}

export interface SubjectLearningStateSummary {
  subjectId: string
  subjectName: string
  totalTopics: number
  strongCount: number
  developingCount: number
  weakCount: number
  insufficientDataCount: number
  topicResults: LearningStateResult[]
}

export interface StartStudySessionPayload {
  topicId: string
  sessionType?: StudySessionType
  notes?: string
}

export interface CompleteStudySessionPayload {
  notes?: string
}

export interface ManualStudySessionPayload {
  topicId: string
  sessionType?: StudySessionType
  startedAt: string
  endedAt: string
  notes?: string
}
