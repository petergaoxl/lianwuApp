import { writable } from 'svelte/store';
import type { Task, TaskStatus } from '$lib/types/task.types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: '完成首次任务提交',
    description: '提交你的第一个任务，体验平台功能',
    reward: 10,
    status: 'active',
    category: 'onboarding',
    progress: 0,
    total: 1,
    startDate: new Date(),
    endDate: undefined
  },
  {
    id: '2',
    title: '关注项目官方 X 账号',
    description: '在 X 上关注官方账号，获取最新任务更新',
    reward: 5,
    status: 'active',
    category: 'social',
    progress: 0,
    total: 1,
    startDate: new Date(),
    endDate: undefined
  },
  {
    id: '3',
    title: '完成每日签到',
    description: '每日签到可持续领取奖励',
    reward: 2,
    status: 'pending',
    category: 'daily',
    progress: 0,
    total: 1,
    startDate: new Date(),
    endDate: undefined
  }
];

const createTaskStore = () => {
  const { subscribe, update, set } = writable<TaskState>({
    tasks: initialTasks,
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    // 模拟加载任务
    loadTasks: async () => {
      set({ tasks: initialTasks, isLoading: false, error: null });
    },

    // 更新任务状态
    updateTaskStatus: (taskId: string, status: TaskStatus) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
      }));
    },

    // 标记完成
    completeTask: (taskId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'completed', progress: t.total ?? 1 } : t
        )
      }));
    },

    // 领取奖励
    claimReward: (taskId: string) => {
      update((state) => ({
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'claimed' } : t
        )
      }));
    },

    clearError: () =>
      update((state) => ({
        ...state,
        error: null
      }))
  };
};

export const taskStore = createTaskStore();
