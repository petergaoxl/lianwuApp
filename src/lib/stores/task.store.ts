import { writable } from 'svelte/store';
import type { Task, TaskStatus } from '$lib/types/task.types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

// 模拟初始任务数据
const initialTasks: Task[] = [
  {
    id: '1',
    title: '完成首次任务提交',
    description: '提交你的第一个任务，体验平台功能',
    reward: 50,
    status: 'completed' as TaskStatus,
    category: 'onboarding' as any,
    startDate: new Date('2024-01-01'),
    requirements: ['注册账号', '完成身份验证', '提交任务']
  },
  {
    id: '2',
    title: '邀请3位好友注册',
    description: '分享你的邀请链接，邀请好友加入平台',
    reward: 100,
    status: 'active' as TaskStatus,
    category: 'social' as any,
    progress: 1,
    total: 3,
    startDate: new Date('2024-01-02'),
    requirements: ['生成邀请链接', '分享给好友', '好友完成注册']
  },
  {
    id: '3',
    title: '连续7天登录平台',
    description: '保持活跃，每天登录平台签到',
    reward: 200,
    status: 'active' as TaskStatus,
    category: 'daily' as any,
    progress: 3,
    total: 7,
    startDate: new Date('2024-01-03'),
    endDate: new Date('2024-01-10'),
    requirements: ['每天登录', '完成签到']
  },
  {
    id: '4',
    title: '提交高质量内容',
    description: '创作并提交一篇原创内容',
    reward: 150,
    status: 'pending' as TaskStatus,
    category: 'content' as any,
    startDate: new Date('2024-01-04'),
    requirements: ['撰写内容', '提交审核', '等待批准']
  }
];

const createTaskStore = () => {
  const { subscribe, set, update } = writable<TaskState>({
    tasks: initialTasks,
    isLoading: false,
    error: null,
  });

  return {
    subscribe,
    
    // 获取所有任务
    loadTasks: async () => {
      update(state => ({ ...state, isLoading: true, error: null }));
      try {
        // TODO: 后续替换为 API 调用
        // const response = await fetch('/api/tasks');
        // const tasks = await response.json();
        update(state => ({ ...state, tasks: initialTasks, isLoading: false }));
      } catch (error) {
        update(state => ({ 
          ...state, 
          isLoading: false, 
          error: '加载任务失败' 
        }));
      }
    },

    // 更新任务状态
    updateTaskStatus: (taskId: string, status: TaskStatus) => {
      update(state => ({
        ...state,
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, status } : task
        )
      }));
    },

    // 领取任务奖励
    claimReward: async (taskId: string) => {
      update(state => ({ ...state, isLoading: true }));
      try {
        // TODO: 调用智能合约发放奖励
        // await rewardContract.claimReward(taskId);
        
        update(state => ({
          ...state,
          tasks: state.tasks.map(task =>
            task.id === taskId ? { ...task, status: 'claimed' as TaskStatus } : task
          ),
          isLoading: false
        }));
        return true;
      } catch (error) {
        update(state => ({ ...state, isLoading: false, error: '领取奖励失败' }));
        return false;
      }
    },

    // 重置错误
    clearError: () => update(state => ({ ...state, error: null })),
  };
};

export const taskStore = createTaskStore();