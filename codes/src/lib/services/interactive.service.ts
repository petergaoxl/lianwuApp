import { supabase } from '$lib/supabaseClient';

// 提交评分
export async function submitScores(
  taskId: string,
  userId: string,
  scores: { dimension: string; score: number }[]
) {
  try {
    // 1. 创建提交记录
    const { data: submission, error: submissionError } = await supabase
      .from('task_submissions')
      .insert({
        task_id: taskId,
        user_id: userId,
        submission_data: { scores }
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // 2. 插入每个评分
    const scoresToInsert = scores.map(s => ({
      submission_id: submission.id,
      dimension: s.dimension,
      score: s.score
    }));

    const { error: scoresError } = await supabase
      .from('task_scores')
      .insert(scoresToInsert);

    if (scoresError) throw scoresError;

    return submission;
  } catch (error) {
    console.error('提交评分失败:', error);
    throw error;
  }
}

// 获取任务的所有评分数据
export async function getTaskScores(taskId: string) {
  try {
    const { data, error } = await supabase
      .from('task_scores')
      .select(`
        *,
        task_submissions(user_id, submission_data, created_at)
      `)
      .eq('task_submissions.task_id', taskId);

    if (error) throw error;

    // 按维度分组统计
    const stats = {} as Record<string, { scores: number[]; average: number; count: number }>;
    
    data?.forEach((item: any) => {
      const dimension = item.dimension;
      if (!stats[dimension]) {
        stats[dimension] = { scores: [], average: 0, count: 0 };
      }
      stats[dimension].scores.push(item.score);
      stats[dimension].count++;
    });

    // 计算平均分
    Object.keys(stats).forEach(dim => {
      const scores = stats[dim].scores;
      stats[dim].average = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    return stats;
  } catch (error) {
    console.error('获取评分数据失败:', error);
    throw error;
  }
}

// 获取用户是否已提交
export async function getUserSubmission(taskId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') {
      return null; // 未找到提交
    }
    if (error) throw error;

    return data;
  } catch (error) {
    console.error('获取用户提交失败:', error);
    throw error;
  }
}

// 获取评分分布（用于饼图）
export async function getScoreDistribution(taskId: string, dimension: string) {
  try {
    const { data, error } = await supabase
      .from('task_scores')
      .select('score')
      .eq('task_submissions.task_id', taskId)
      .eq('dimension', dimension);

    if (error) throw error;

    // 按分数统计
    const distribution = {} as Record<number, number>;
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }

    data?.forEach((item: any) => {
      distribution[item.score]++;
    });

    return distribution;
  } catch (error) {
    console.error('获取分布失败:', error);
    throw error;
  }
}
