<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ArrowLeft, Trophy, Clock, AlertCircle, CheckCircle2, Loader } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { taskStore } from '$lib/stores/task.store';
  import { submitScores, getTaskScores, getUserSubmission } from '$lib/services/interactive.service';
  import type { Task } from '$lib/types/task.types';
  import type { LoginMethod } from '$lib/services/user.service';

  export let data;

  let task: Task | null = null;
$: userId = $authStore.user?.id || '';  // ✅ 反应式变量  
  // 打分相关状态
  let dimensions = [
    { name: '设计美感', key: 'design' },
    { name: '功能完整', key: 'function' },
    { name: '用户体验', key: 'ux' },
    { name: '创新度', key: 'innovation' }
  ];
  
  let scores = {
    design: 5,
    function: 5,
    ux: 5,
    innovation: 5
  };

  let submitted = false;
  let loading = false;
  let error = '';
  let successMessage = '';
  let statsData: any = null;
  let showStats = false;

  async function handleLoginClick() {
  try {
    console.log('🔗 用户点击连接钱包');
    await authStore.loginWithWeb3Auth('google');
    console.log('✅ 登录成功');
  } catch (err) {
    console.error('❌ 登录失败:', err);
  }
}

  onMount(async () => {
    console.log('📍 onMount 触发, userId:', userId);
    
    // 从路由参数获取任务ID
    if (!data?.task?.id && typeof window !== 'undefined') {
      const taskId = window.location.pathname.split('/').pop();
      if (!taskId) {
        error = '找不到任务ID';
        return;
      }
    }

    if (!data?.task) {
      error = '无法加载任务信息';
      return;
    }

    task = data.task;

    // 👉 关键改进 1：检查用户是否真的登录了
    if (userId) {
      console.log('✅ 用户已登录, userId:', userId);
      try {
        const submission = await getUserSubmission(task.id, userId);
        if (submission) {
          submitted = true;
          if (submission.submission_data?.scores) {
            scores = submission.submission_data.scores;
          }
          console.log('✅ 找到之前的提交');
        }
      } catch (err) {
        console.error('❌ 检查提交状态失败:', err);
        // 不要中断用户体验，继续加载页面
      }

      // 加载统计数据
      await loadStats();
    } else {
      console.warn('⚠️ 用户未登录或 userId 不可用');
    }
  });

  async function loadStats() {
    try {
      const stats = await getTaskScores(task.id);
      statsData = stats;
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }

  async function handleSubmit() {
    console.log('🖱️ 提交按钮被点击');
    console.log('📊 当前状态:', { userId, submitted, taskId: task?.id });

    // 👉 关键改进 1：检查任务信息是否完整（修复 taskId undefined 错误）
    if (!task || !task.id) {
      error = '❌ 任务信息不完整，无法提交';
      console.warn('task 或 task.id 不存在:', { task, taskId: task?.id });
      return;
    }

    // 👉 关键改进 2：更清晰的登录检查
    if (!userId) {
      error = '❌ 请先登录后再提交评分';
      console.warn('用户未登录，无法提交');
      return;
    }

    if (submitted) {
      error = '⚠️ 你已经提交过评分了，无法重复提交';
      console.warn('用户已经提交过');
      return;
    }

    loading = true;
    error = '';
    successMessage = '';

    try {
      console.log('📝 准备提交评分...');
      const scoreArray = Object.entries(scores).map(([dimension, score]) => ({
        dimension,
        score: score as number
      }));

      console.log('📤 发送请求到 submitScores:', {
        taskId: task.id,
        userId,
        scoresCount: scoreArray.length
      });

      await submitScores(task.id, userId, scoreArray);
      
      submitted = true;
      successMessage = '✅ 评分已提交成功！感谢你的参与！';
      console.log('✅ 提交成功');
      
      await loadStats();
      
      // 3秒后关闭成功消息
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (err: any) {
      // 👉 关键改进 3：更详细的错误处理
      console.error('❌ 提交失败，详细错误:', err);
      
      const errorMsg = err?.message || err?.error_description || '未知错误';
      
      // 根据错误类型显示不同的提示
      if (errorMsg.includes('认证') || errorMsg.includes('Auth')) {
        error = '❌ 认证失败，请重新登录后再试';
      } else if (errorMsg.includes('权限') || errorMsg.includes('42501')) {
        error = '❌ 权限不足（RLS 策略问题）：请联系管理员检查数据库配置';
      } else if (errorMsg.includes('已经') || errorMsg.includes('UNIQUE') || errorMsg.includes('23505')) {
        error = '❌ 你已经提交过该任务的评分了';
        submitted = true;
      } else if (errorMsg.includes('ID不匹配')) {
        error = '❌ 用户身份验证失败，请重新登录';
      } else {
        error = `❌ 提交失败: ${errorMsg}`;
      }
    } finally {
      loading = false;
    }
  }

  function goBack() {
    goto('/');
  }

  function getCategoryName(categoryId: string): string {
    const categories: Record<string, string> = {
      onboarding: '入门任务',
      social: '社交任务',
      daily: '每日任务',
      content: '内容任务',
      special: '特殊任务'
    };
    return categories[categoryId] || categoryId;
  }

  function getCategoryColor(categoryId: string): string {
    const colors: Record<string, string> = {
      onboarding: 'from-green-400 to-emerald-500',
      social: 'from-purple-400 to-pink-500',
      daily: 'from-blue-400 to-cyan-500',
      content: 'from-orange-400 to-red-500',
      special: 'from-yellow-400 to-amber-500'
    };
    return colors[categoryId] || 'from-gray-400 to-gray-600';
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-300' },
      pending: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
      claimed: { bg: 'bg-purple-500/20', text: 'text-purple-300' },
      expired: { bg: 'bg-red-500/20', text: 'text-red-300' }
    };
    const color = colors[status] || colors.active;
    return `${color.bg} ${color.text}`;
  }
</script>

<main class="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
<Navbar onLoginClick={handleLoginClick} />
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 返回按钮 -->
    <button
      on:click={goBack}
      class="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
    >
      <ArrowLeft class="w-5 h-5" />
      <span>返回任务列表</span>
    </button>

    {#if !task}
      <div class="text-center py-12">
        <Loader class="w-12 h-12 mx-auto text-purple-400 animate-spin mb-4" />
        <p class="text-gray-400">加载任务中...</p>
      </div>
    {:else}
      <!-- 任务头部信息 -->
      <div class="mb-8 p-8 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <!-- 标题 -->
            <h1 class="text-3xl font-bold text-white mb-4">{task.title}</h1>

            <!-- 分类和状态标签 -->
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <span
                class={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getCategoryColor(task.category)} text-white`}
              >
                {getCategoryName(task.category)}
              </span>
              <span class={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status === 'active'
                  ? '进行中'
                  : task.status === 'completed'
                    ? '已完成'
                    : task.status === 'pending'
                      ? '待审核'
                      : task.status === 'claimed'
                        ? '已领取'
                        : '已过期'}
              </span>
            </div>

            <!-- 描述 -->
            {#if task.description}
              <p class="text-gray-300 text-lg mb-4">{task.description}</p>
            {/if}

            <!-- 任务信息 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex items-center gap-3">
                <Trophy class="w-5 h-5 text-yellow-400" />
                <div>
                  <p class="text-gray-400 text-sm">获得奖励</p>
                  <p class="text-white font-bold text-lg">+{task.reward}</p>
                </div>
              </div>
              {#if task.endDate}
                <div class="flex items-center gap-3">
                  <Clock class="w-5 h-5 text-blue-400" />
                  <div>
                    <p class="text-gray-400 text-sm">截止时间</p>
                    <p class="text-white font-bold">
                      {new Date(task.endDate).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      {#if error}
        <div class="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-red-300 font-semibold">错误提示</p>
            <p class="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      {/if}

      <!-- 成功提示 -->
      {#if successMessage}
        <div class="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 flex items-start gap-3">
          <CheckCircle2 class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p class="text-green-300">{successMessage}</p>
        </div>
      {/if}

      <!-- 打分表单 -->
      {#if !submitted}
        <div class="mb-8 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 class="text-2xl font-bold text-white mb-6">评分与反馈</h2>
          <p class="text-gray-400 mb-6">请从以下角度对该任务进行打分（1-10分）</p>

          <!-- 评分项 -->
          <div class="space-y-6 mb-8">
            {#each dimensions as dimension}
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-white font-medium">{dimension.name}</label>
                  <span class="text-xl font-bold text-purple-400">{scores[dimension.key]}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  bind:value={scores[dimension.key]}
                  class="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
                <div class="flex gap-2 text-xs text-gray-500">
                  <span>1</span>
                  <div class="flex-1"></div>
                  <span>10</span>
                </div>
              </div>
            {/each}
          </div>

          <!-- 提交按钮 -->
          <button
            on:click={handleSubmit}
            disabled={loading || !userId}
            class="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if loading}
              <Loader class="w-5 h-5 animate-spin" />
              <span>提交中...</span>
            {:else if !userId}
              <AlertCircle class="w-5 h-5" />
              <span>请先登录</span>
            {:else}
              <CheckCircle2 class="w-5 h-5" />
              <span>提交评分</span>
            {/if}
          </button>
        </div>
      {:else}
        <!-- 已提交提示 -->
        <div class="mb-8 p-8 rounded-2xl bg-green-500/20 border border-green-500/50 backdrop-blur-sm">
          <div class="flex items-start gap-4">
            <CheckCircle2 class="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 class="text-xl font-bold text-green-300 mb-2">✅ 评分已提交</h3>
              <p class="text-green-200">感谢你的参与和反馈，你的评分已保存至数据库！</p>
              {#if scores}
                <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {#each dimensions as dimension}
                    <div class="bg-green-500/20 rounded-lg p-3 border border-green-500/30">
                      <p class="text-sm text-green-300 mb-1">{dimension.name}</p>
                      <p class="text-2xl font-bold text-green-400">{scores[dimension.key]}</p>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- 统计数据 -->
      {#if statsData}
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">评分统计</h2>
            <button
              on:click={() => (showStats = !showStats)}
              class="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
            >
              {showStats ? '隐藏' : '显示'}统计数据
            </button>
          </div>

          {#if showStats}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {#each dimensions as dimension}
                {#if statsData[dimension.key]}
                  <div class="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 class="text-white font-semibold mb-3">{dimension.name}</h4>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400 text-sm">平均分</span>
                        <span class="text-2xl font-bold text-purple-400">
                          {statsData[dimension.key].average.toFixed(1)}
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400 text-sm">参与人数</span>
                        <span class="text-lg font-bold text-cyan-400">
                          {statsData[dimension.key].count}
                        </span>
                      </div>
                      <div class="pt-2 border-t border-white/10">
                        <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            class="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                            style={`width: ${(statsData[dimension.key].average / 10) * 100}%`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</main>

<style>
  /* 美化range输入 */
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153));
    cursor: pointer;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }

  input[type='range']::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153));
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
  }

  input[type='range']::-moz-range-track {
    background: transparent;
    border: none;
  }
</style>