// src/lib/stores/task.store.ts (增强版)

import { writable, derived } from 'svelte/store';
import type { Task, TaskStatus, UserTaskStats } from '$lib/types/task.types';
import * as taskService from '$lib/services/task.service';

interface TaskState {
  tasks: Task[];
  stats: UserTaskStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: TaskState = {
  tasks: [],
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null
};

function createTaskStore() {
  const { subscribe, set, update } = writable<TaskState>(initialState);

  return {
    subscribe,

    // ========== 数据加载 ==========
    
    /**
     * 加载用户任务
     */
    async loadUserTasks(userId: string) {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const tasks = await taskService.getUserTasks(userId);
        const stats = taskService.calculateTaskStats(tasks);

        update((state) => ({
          ...state,
          tasks,
          stats,
          isLoading: false,
          lastUpdated: new Date()
        }));
      } catch (error: any) {
        const message = error?.message || '加载任务失败';
        console.error('❌ 加载任务错误:', error);
        update((state) => ({
          ...state,
          isLoading: false,
          error: message
        }));
      }
    },

    /**
     * 加载活跃任务
     */
    async loadActiveTasks() {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const tasks = await taskService.getActiveTasks();
        const stats = taskService.calculateTaskStats(tasks);

        update((state) => ({
          ...state,
          tasks,
          stats,
          isLoading: false,
          lastUpdated: new Date()
        }));
      } catch (error: any) {
        const message = error?.message || '加载活跃任务失败';
        console.error('❌ 加载活跃任务错误:', error);
        update((state) => ({
          ...state,
          isLoading: false,
          error: message
        }));
      }
    },

    /**
     * 按分类加载任务
     */
    async loadTasksByCategory(category: string) {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const tasks = await taskService.getTasksByCategory(category);
        const stats = taskService.calculateTaskStats(tasks);

        update((state) => ({
          ...state,
          tasks,
          stats,
          isLoading: false,
          lastUpdated: new Date()
        }));
      } catch (error: any) {
        const message = error?.message || '加载分类任务失败';
        console.error('❌ 加载分类任务错误:', error);
        update((state) => ({
          ...state,
          isLoading: false,
          error: message
        }));
      }
    },

    // ========== 任务操作 ==========

    /**
     * 完成任务
     */
    async completeTask(taskId: string, userId: string) {
      try {
        const task = await taskService.completeTask(taskId, userId);
        
        update((state) => ({
          ...state,
          tasks: state.tasks.map((t) => (t.id === taskId ? task : t)),
          error: null
        }));

        // 重新计算统计
        this.recalculateStats();
      } catch (error: any) {
        const message = error?.message || '完成任务失败';
        console.error('❌ 完成任务错误:', error);
        update((state) => ({
          ...state,
          error: message
        }));
        throw error;
      }
    },

    /**
     * 领取奖励
     */
    async claimReward(taskId: string, userId: string) {
      try {
        const { task, newBalance } = await taskService.claimReward(taskId, userId);
        
        update((state) => ({
          ...state,
          tasks: state.tasks.map((t) => (t.id === taskId ? task : t)),
          error: null
        }));

        // 重新计算统计
        this.recalculateStats();

        return newBalance;
      } catch (error: any) {
        const message = error?.message || '领取奖励失败';
        console.error('❌ 领取奖励错误:', error);
        update((state) => ({
          ...state,
          error: message
        }));
        throw error;
      }
    },

    /**
     * 更新任务状态
     */
    async updateTaskStatus(taskId: string, status: TaskStatus, userId: string) {
      try {
        const task = await taskService.updateTaskStatus(taskId, status, userId);
        
        update((state) => ({
          ...state,
          tasks: state.tasks.map((t) => (t.id === taskId ? task : t)),
          error: null
        }));

        // 重新计算统计
        this.recalculateStats();
      } catch (error: any) {
        const message = error?.message || '更新任务状态失败';
        console.error('❌ 更新任务状态错误:', error);
        update((state) => ({
          ...state,
          error: message
        }));
        throw error;
      }
    },

    /**
     * 更新任务进度
     */
    async updateTaskProgress(taskId: string, userId: string, progress: number) {
      try {
        const task = await taskService.updateTaskProgress(taskId, userId, progress);
        
        update((state) => ({
          ...state,
          tasks: state.tasks.map((t) => (t.id === taskId ? task : t)),
          error: null
        }));

        // 检查是否已完成
        if (task.progress === task.total) {
          await this.completeTask(taskId, userId);
        }

        // 重新计算统计
        this.recalculateStats();
      } catch (error: any) {
        const message = error?.message || '更新任务进度失败';
        console.error('❌ 更新任务进度错误:', error);
        update((state) => ({
          ...state,
          error: message
        }));
        throw error;
      }
    },

    /**
     * 提交任务
     */
    async submitTask(taskId: string, userId: string, proof?: string) {
      try {
        const submission = await taskService.submitTask(taskId, userId, proof);
        
        // 更新任务状态为待审核
        const currentState = get(this);
        const task = currentState.tasks.find((t) => t.id === taskId);
        
        if (task) {
          update((state) => ({
            ...state,
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, status: 'pending' } : t
            ),
            error: null
          }));
        }

        return submission;
      } catch (error: any) {
        const message = error?.message || '提交任务失败';
        console.error('❌ 提交任务错误:', error);
        update((state) => ({
          ...state,
          error: message
        }));
        throw error;
      }
    },

    // ========== 辅助方法 ==========

    /**
     * 重新计算统计信息
     */
    recalculateStats() {
      update((state) => {
        const stats = taskService.calculateTaskStats(state.tasks);
        return {
          ...state,
          stats
        };
      });
    },

    /**
     * 清除错误
     */
    clearError() {
      update((state) => ({
        ...state,
        error: null
      }));
    },

    /**
     * 重置存储
     */
    reset() {
      set(initialState);
    }
  };
}

export const taskStore = createTaskStore();

// ========== 衍生存储 ==========

/**
 * 统计信息存储
 */
export const taskStats = derived(taskStore, ($store) => $store.stats || {
  totalCompleted: 0,
  totalEarned: 0,
  activeCount: 0,
  completionRate: 0
});

/**
 * 任务列表存储
 */
export const tasks = derived(taskStore, ($store) => $store.tasks || []);

/**
 * 加载状态存储
 */
export const isLoadingTasks = derived(taskStore, ($store) => $store.isLoading);

/**
 * 错误信息存储
 */
export const taskError = derived(taskStore, ($store) => $store.error);

/**
 * 已完成任务存储
 */
export const completedTasks = derived(tasks, ($tasks) => {
  if (!Array.isArray($tasks)) return [];
  return $tasks.filter((t) => t.status === 'completed' || t.status === 'claimed');
});

/**
 * 活跃任务存储
 */
export const activeTasks = derived(tasks, ($tasks) => {
  if (!Array.isArray($tasks)) return [];
  return $tasks.filter((t) => t.status === 'active');
});

/**
 * 待审核任务存储
 */
export const pendingTasks = derived(tasks, ($tasks) => {
  if (!Array.isArray($tasks)) return [];
  return $tasks.filter((t) => t.status === 'pending');
});

/**
 * 按分类过滤的任务存储工厂函数
 */
export function createCategoryFilter(category: string) {
  return derived(tasks, ($tasks) => {
    if (!Array.isArray($tasks)) return [];
    return $tasks.filter((t) => t.category === category);
  });
}

// 辅助函数获取当前状态（用于需要立即访问的地方）
function get(store: any) {
  let value: any;
  const unsubscribe = store.subscribe(v => value = v);
  unsubscribe();
  return value;
}