export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate?: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate?: string; // ISO string
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventRequest {
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  color?: string;
}

export interface PlannerSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  highPriorityPendingCount: number;
  upcomingDeadlinesCount: number;
  todayTasksCount: number;
}
