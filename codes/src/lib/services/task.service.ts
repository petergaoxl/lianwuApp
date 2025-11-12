// src/lib/services/task.service.ts

import { supabase } from '$lib/supabaseClient';
import type { Task, TaskSubmission, UserTaskStats } from '$lib/types/task.types';

/**
 * 获取用户的所有任务（包括发布的和被分配的）
 */
export async function getUserTasks(userId: string): Promise<Task[]> {
  try {
    // 查询：用户发布的任务 OR 分配给用户的任务 OR 未分配的公开任务
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`created_by.eq.${userId},assigned_to.eq.${userId},assigned_to.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取任务失败:', error);
      throw error;
    }

    // 转换数据库字段到类型定义
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      reward: item.reward,
      status: item.status,
      category: item.category,
      progress: item.progress,
      total: item.total,
      startDate: new Date(item.start_date),
      endDate: item.end_date ? new Date(item.end_date) : undefined
    }));
  } catch (error) {
    console.error('getUserTasks 错误:', error);
    throw error;
  }
}

/**
 * 获取用户的任务统计
 */
export async function getUserTaskStats(userId: string): Promise<UserTaskStats> {
  try {
    const { data, error } = await supabase
      .from('user_task_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('获取任务统计失败:', error);
      throw error;
    }

    if (data) {
      return {
        totalCompleted: data.total_completed || 0,
        totalEarned: data.total_earned || 0,
        activeCount: data.active_count || 0,
        completionRate: data.completion_rate || 0
      };
    }

    // 如果数据库中没有记录，从任务列表计算
    const tasks = await getUserTasks(userId);
    return calculateTaskStats(tasks);
  } catch (error) {
    console.error('getUserTaskStats 错误:', error);
    throw error;
  }
}

/**
 * 本地计算任务统计
 */
export function calculateTaskStats(tasks: Task[]): UserTaskStats {
  if (!tasks || tasks.length === 0) {
    return {
      totalCompleted: 0,
      totalEarned: 0,
      activeCount: 0,
      completionRate: 0
    };
  }

  const completed = tasks.filter(t => t.status === 'completed' || t.status === 'claimed').length;
  const totalEarned = tasks
    .filter(t => t.status === 'claimed')
    .reduce((sum, t) => sum + t.reward, 0);
  const activeCount = tasks.filter(t => t.status === 'active').length;
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return {
    totalCompleted: completed,
    totalEarned,
    activeCount,
    completionRate
  };
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(
  taskId: string,
  status: Task['status'],
  userId: string
): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('assigned_to', userId)
      .select()
      .single();

    if (error) {
      console.error('更新任务状态失败:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      reward: data.reward,
      status: data.status,
      category: data.category,
      progress: data.progress,
      total: data.total,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined
    };
  } catch (error) {
    console.error('updateTaskStatus 错误:', error);
    throw error;
  }
}

/**
 * 完成任务（标记为 completed）
 */
export async function completeTask(taskId: string, userId: string): Promise<Task> {
  return updateTaskStatus(taskId, 'completed', userId);
}

/**
 * 领取奖励（标记为 claimed 并增加用户余额）
 */
export async function claimReward(taskId: string, userId: string): Promise<{ task: Task; newBalance: number }> {
  try {
    // 1. 更新任务状态
    const task = await updateTaskStatus(taskId, 'claimed', userId);

    // 2. 获取任务的奖励
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('reward')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    // 3. 更新用户余额
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance, total_earned')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newBalance = (userData?.balance || 0) + (taskData?.reward || 0);
    const newTotalEarned = (userData?.total_earned || 0) + (taskData?.reward || 0);

    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance, total_earned: newTotalEarned })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 4. 记录交易日志
    await supabase
      .from('transaction_logs')
      .insert({
        user_id: userId,
        type: 'reward',
        amount: taskData.reward,
        task_id: taskId,
        description: 'Task reward claimed'
      });

    return { task, newBalance };
  } catch (error) {
    console.error('claimReward 错误:', error);
    throw error;
  }
}

/**
 * 提交任务（上传证明）
 */
export async function submitTask(
  taskId: string,
  userId: string,
  proof?: string
): Promise<TaskSubmission> {
  try {
    const { data, error } = await supabase
      .from('task_submissions')
      .insert({
        task_id: taskId,
        user_id: userId,
        proof: proof || null,
        submitted_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('提交任务失败:', error);
      throw error;
    }

    // 同时更新任务状态为待审核
    await updateTaskStatus(taskId, 'pending', userId);

    return {
      taskId: data.task_id,
      userId: data.user_id,
      proof: data.proof,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      status: data.status
    };
  } catch (error) {
    console.error('submitTask 错误:', error);
    throw error;
  }
}

/**
 * 获取任务提交记录
 */
export async function getTaskSubmission(
  taskId: string,
  userId: string
): Promise<TaskSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('获取提交记录失败:', error);
      throw error;
    }

    if (!data) return null;

    return {
      taskId: data.task_id,
      userId: data.user_id,
      proof: data.proof,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      status: data.status
    };
  } catch (error) {
    console.error('getTaskSubmission 错误:', error);
    throw error;
  }
}

/**
 * 更新任务进度
 */
export async function updateTaskProgress(
  taskId: string,
  userId: string,
  progress: number
): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ progress, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('assigned_to', userId)
      .select()
      .single();

    if (error) {
      console.error('更新进度失败:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      reward: data.reward,
      status: data.status,
      category: data.category,
      progress: data.progress,
      total: data.total,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined
    };
  } catch (error) {
    console.error('updateTaskProgress 错误:', error);
    throw error;
  }
}

/**
 * 获取活跃任务（未过期）
 */
export async function getActiveTasks(): Promise<Task[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`end_date.is.null,end_date.gt.${now}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取活跃任务失败:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      reward: item.reward,
      status: item.status,
      category: item.category,
      progress: item.progress,
      total: item.total,
      startDate: new Date(item.start_date),
      endDate: item.end_date ? new Date(item.end_date) : undefined
    }));
  } catch (error) {
    console.error('getActiveTasks 错误:', error);
    throw error;
  }
}

/**
 * 按分类获取任务
 */
export async function getTasksByCategory(category: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取分类任务失败:', error);
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      reward: item.reward,
      status: item.status,
      category: item.category,
      progress: item.progress,
      total: item.total,
      startDate: new Date(item.start_date),
      endDate: item.end_date ? new Date(item.end_date) : undefined
    }));
  } catch (error) {
    console.error('getTasksByCategory 错误:', error);
    throw error;
  }
}

export const taskService = {
  getUserTasks,
  getUserTaskStats,
  calculateTaskStats,
  updateTaskStatus,
  completeTask,
  claimReward,
  submitTask,
  getTaskSubmission,
  updateTaskProgress,
  getActiveTasks,
  getTasksByCategory
};