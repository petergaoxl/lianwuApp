import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import type { Task } from '$lib/types/task.types';

export const load: PageServerLoad = async ({ params }) => {
  const taskId = params.id;

  if (!taskId) {
    throw error(400, '缺少任务ID');
  }

  try {
    // 从数据库获取任务详情
    const { data: taskData, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !taskData) {
      console.error('获取任务失败:', fetchError);
      throw error(404, '任务不存在');
    }

    // 将数据库字段转换为前端Task类型
    const task: Task = {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      reward: taskData.reward,
      status: taskData.status,
      category: taskData.category,
      progress: taskData.progress,
      total: taskData.total,
      startDate: new Date(taskData.start_date),
      endDate: taskData.end_date ? new Date(taskData.end_date) : undefined
    };

    return {
      task
    };
  } catch (err) {
    console.error('加载任务详情失败:', err);
    throw error(500, '加载任务详情失败');
  }
};
