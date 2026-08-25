export type StudySessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type StudySessionType =
  | 'STUDY'
  | 'REVISION'
  | 'PRACTICE'
  | 'READING'
  | 'VIDEO'
  | 'ASSIGNMENT'
  | 'MOCK_TEST'

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
