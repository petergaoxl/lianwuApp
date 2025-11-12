import { supabase } from '$lib/supabaseClient';

/**
 * 提交评分 - Web3Auth 最终修复版
 * 
 * 关键修改：
 * - 完全移除 supabase.auth.getUser() 调用
 * - 只验证前端传入的 userId（来自 Web3Auth）
 * - 直接使用 userId，不依赖 Supabase Auth session
 */
export async function submitScores(
  taskId: string,
  userId: string,
  scores: { dimension: string; score: number }[]
) {
  try {
    console.log('📝 开始提交评分...');
    console.log('参数：', { taskId, userId, scoresCount: scores.length });

    // 👉 只验证前端传入的 userId（来自 Web3Auth）
    if (!userId) {
      throw new Error('用户 ID 不存在，请先登录');
    }

    // 👉 验证 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('❌ 用户 ID 格式无效:', userId);
      throw new Error('用户 ID 格式错误');
    }

    // 👉 验证 taskId
    if (!taskId || !uuidRegex.test(taskId)) {
      throw new Error('任务 ID 无效');
    }

    console.log('✅ 前置验证通过');

    // 1. 创建提交记录
    console.log('📝 创建提交记录...');
    const { data: submission, error: submissionError } = await supabase
      .from('task_submissions')
      .insert({
        task_id: taskId,
        user_id: userId,
        submission_data: { scores }
      })
      .select()
      .single();

    if (submissionError) {
      console.error('❌ 提交记录创建失败:', submissionError);
      
      if (submissionError.code === '23505') {
        throw new Error('你已经提交过该任务的评分了');
      }
      if (submissionError.code === '42501' || submissionError.message?.includes('permission')) {
        throw new Error('权限不足：无法创建提交记录');
      }
      
      throw submissionError;
    }

    console.log('✅ 提交记录创建成功:', submission.id);

    // 2. 插入每个评分
    console.log('📝 插入评分数据...');
    const scoresToInsert = scores.map(s => ({
      submission_id: submission.id,
      dimension: s.dimension,
      score: s.score
    }));

    const { error: scoresError } = await supabase
      .from('task_scores')
      .insert(scoresToInsert);

    if (scoresError) {
      console.error('❌ 评分插入失败:', scoresError);
      
      if (scoresError.code === '42501' || scoresError.message?.includes('permission')) {
        throw new Error('权限不足：无法保存评分');
      }
      
      throw scoresError;
    }

    console.log('✅ 评分数据插入成功，共', scores.length, '条');

    return submission;
  } catch (error) {
    console.error('❌ 提交评分失败:', error);
    throw error;
  }
}

/**
 * 获取任务的所有评分数据
 */
export async function getTaskScores(taskId: string) {
  try {
    console.log('📊 加载评分统计...');
    
    const { data, error } = await supabase
      .from('task_scores')
      .select(`
        *,
        task_submissions(user_id, submission_data, created_at)
      `)
      .eq('task_submissions.task_id', taskId);

    if (error) {
      console.error('❌ 获取评分数据失败:', error);
      throw error;
    }

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

    console.log('✅ 评分统计加载成功');
    return stats;
  } catch (error) {
    console.error('❌ 获取评分数据失败:', error);
    throw error;
  }
}

/**
 * 获取用户是否已提交
 */
export async function getUserSubmission(taskId: string, userId: string) {
  try {
    console.log('🔍 检查是否已提交...');
    
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') {
      console.log('ℹ️ 用户还未提交过');
      return null;
    }
    
    if (error) {
      console.error('❌ 获取用户提交失败:', error);
      throw error;
    }

    console.log('✅ 找到用户之前的提交');
    return data;
  } catch (error) {
    console.error('❌ 获取用户提交失败:', error);
    throw error;
  }
}

/**
 * 获取评分分布（用于饼图）
 */
export async function getScoreDistribution(taskId: string, dimension: string) {
  try {
    const { data, error } = await supabase
      .from('task_scores')
      .select('score')
      .eq('task_submissions.task_id', taskId)
      .eq('dimension', dimension);

    if (error) {
      console.error('❌ 获取分布失败:', error);
      throw error;
    }

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
    console.error('❌ 获取分布失败:', error);
    throw error;
  }
}
