// src/lib/services/publish.service.ts

import { supabase } from '$lib/supabaseClient';
import type { Task, TaskCategory } from '$lib/types/task.types';

/**
 * 发布新任务
 */
export async function publishTask(
  userId: string,
  data: {
    title: string;
    description: string;
    reward: number;
    category: TaskCategory;
    requirements?: string[];
    startDate: Date;
    endDate: Date;
  }
): Promise<Task> {
  try {
    // 验证输入
    if (!data.title?.trim()) {
      throw new Error('任务标题不能为空');
    }
    if (!data.description?.trim()) {
      throw new Error('任务描述不能为空');
    }
    if (data.reward <= 0) {
      throw new Error('奖励金额必须大于0');
    }
    if (data.endDate <= data.startDate) {
      throw new Error('截止日期必须晚于开始日期');
    }

    // 插入新任务
    const { data: insertedData, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title.trim(),
        description: data.description.trim(),
        reward: data.reward,
        category: data.category,
        status: 'active',
        created_by: userId,
        assigned_to: null, // 初始未分配
        progress: 0,
        total: data.requirements?.length || 1,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        requirements: data.requirements || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('发布任务失败:', error);
      throw error;
    }

    // 记录任务创建日志
    try {
      await supabase
        .from('task_logs')
        .insert({
            created_by: userId,
          task_id: insertedData.id,
          user_id: userId,
          action: 'created',
          description: `用户 ${userId} 发布了新任务`,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('记录日志失败:', logError);
      // 不影响主要功能
    }

    return {
      id: insertedData.id,
      title: insertedData.title,
      description: insertedData.description,
      reward: insertedData.reward,
      status: insertedData.status as Task['status'],
      category: insertedData.category,
      progress: insertedData.progress,
      total: insertedData.total,
      startDate: new Date(insertedData.start_date),
      endDate: new Date(insertedData.end_date)
    };
  } catch (error) {
    console.error('publishTask 错误:', error);
    throw error;
  }
}

/**
 * 获取用户发布的任务
 */
export async function getUserPublishedTasks(userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取已发布任务失败:', error);
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
    console.error('getUserPublishedTasks 错误:', error);
    throw error;
  }
}

/**
 * 编辑已发布的任务
 */
export async function updatePublishedTask(
  taskId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    reward: number;
    category: TaskCategory;
    requirements?: string[];
    endDate: Date;
  }>
): Promise<Task> {
  try {
    // 验证用户是否为任务创建者
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('created_by, status')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      throw new Error('任务不存在');
    }

    if (existingTask.created_by !== userId) {
      throw new Error('只能编辑自己发布的任务');
    }

    // 如果任务已被分配，不允许某些编辑
    if (existingTask.status !== 'active' && existingTask.status !== 'pending') {
      throw new Error('已进行中或已完成的任务无法编辑');
    }

    // 准备更新数据
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.reward !== undefined) updateData.reward = data.reward;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.endDate !== undefined) updateData.end_date = data.endDate.toISOString();

    const { data: updatedData, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('更新任务失败:', updateError);
      throw updateError;
    }

    return {
      id: updatedData.id,
      title: updatedData.title,
      description: updatedData.description,
      reward: updatedData.reward,
      status: updatedData.status,
      category: updatedData.category,
      progress: updatedData.progress,
      total: updatedData.total,
      startDate: new Date(updatedData.start_date),
      endDate: updatedData.end_date ? new Date(updatedData.end_date) : undefined
    };
  } catch (error) {
    console.error('updatePublishedTask 错误:', error);
    throw error;
  }
}

/**
 * 删除已发布的任务（仅未开始的任务）
 */
export async function deletePublishedTask(taskId: string, userId: string): Promise<void> {
  try {
    // 验证用户是否为任务创建者
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('created_by, status, assigned_to')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      throw new Error('任务不存在');
    }

    if (existingTask.created_by !== userId) {
      throw new Error('只能删除自己发布的任务');
    }

    // 只有未分配且状态为 active 的任务才能删除
    if (existingTask.assigned_to || existingTask.status !== 'active') {
      throw new Error('已开始或进行中的任务无法删除');
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('created_by', userId);

    if (deleteError) {
      console.error('删除任务失败:', deleteError);
      throw deleteError;
    }

    console.log('✅ 任务已删除:', taskId);
  } catch (error) {
    console.error('deletePublishedTask 错误:', error);
    throw error;
  }
}

/**
 * 获取任务的完成者列表
 */
export async function getTaskCompletions(taskId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*, user_id')
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('获取任务完成者失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getTaskCompletions 错误:', error);
    throw error;
  }
}

export const publishService = {
  publishTask,
  getUserPublishedTasks,
  updatePublishedTask,
  deletePublishedTask,
  getTaskCompletions
};
