export type TaskStatus = 'active' | 'completed' | 'pending' | 'claimed' | 'expired';

export type TaskCategory = 'onboarding' | 'social' | 'daily' | 'content' | 'special';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: TaskStatus;
  category: TaskCategory;
  progress?: number;
  total?: number;
  startDate: Date;
  endDate?: Date;
}

export interface TaskSubmission {
  taskId: string;
  userId: string;
  proof?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UserTaskStats {
  totalCompleted: number;
  totalEarned: number;
  activeCount: number;
  completionRate: number;
}
