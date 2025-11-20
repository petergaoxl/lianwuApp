<script lang="ts">
  import { onMount } from 'svelte';
  import { Trophy, CheckCircle, Clock, Zap, Filter, X } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { 
    taskStore, 
    taskStats, 
    activeTasks, 
    completedTasks,
    isLoadingTasks,
    taskError 
  } from '$lib/stores/task.store';
  import type { UserTaskStats } from '$lib/types/task.types';

  // ========== 状态管理 ==========
  let showLoginModal = false;
  let selectedCategory: string | null = null;
  let showFilters = false;
  let sortBy: 'reward' | 'deadline' | 'category' = 'reward';

  // 订阅存储
  $: user = $authStore.user;
  $: stats = $taskStats;
  $: allTasks = $activeTasks || [];
  $: loading = $isLoadingTasks;
  $: error = $taskError;

  // ========== 生命周期 ==========
  onMount(async () => {
    // 加载任务
    if (user) {
      console.log('🔄 加载用户任务:', user.id);
      await taskStore.loadUserTasks(user.id);
    } else {
      console.log('🔄 加载公开任务');
      await taskStore.loadActiveTasks();
    }
  });

  // ========== 过滤和排序 ==========
  $: filteredAndSortedTasks = filterAndSortTasks(allTasks, selectedCategory, sortBy);

  function filterAndSortTasks(tasks: any[], category: string | null, sort: string) {
    // 确保 tasks 是数组
    if (!Array.isArray(tasks)) {
      console.warn('⚠️ tasks 不是数组:', tasks);
      return [];
    }

    let result = [...tasks];

    // 按分类过滤
    if (category) {
      result = result.filter(t => t.category === category);
    }

    // 排序
    switch (sort) {
      case 'reward':
        result.sort((a, b) => b.reward - a.reward);
        break;
      case 'deadline':
        result.sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return result;
  }

  // ========== 事件处理 ==========
  async function handleClaimReward(event: CustomEvent<string>) {
    const taskId = event.detail;

    if (!user) {
      showLoginModal = true;
      return;
    }

    try {
      const newBalance = await taskStore.claimReward(taskId, user.id);
      console.log('✅ 奖励已领取，新余额:', newBalance);
      // 可以在这里显示成功提示
    } catch (err) {
      console.error('❌ 领取奖励失败:', err);
      // 显示错误提示
    }
  }

  function handleLoginClick() {
    showLoginModal = true;
  }

  function handleCloseModal() {
    showLoginModal = false;
  }

  function handleCategoryFilter(category: string | null) {
    selectedCategory = category;
  }

  function clearFilters() {
    selectedCategory = null;
    sortBy = 'reward';
    showFilters = false;
  }

  // ========== 分类定义 ==========
  const categories = [
    { id: 'onboarding', label: '入门任务', icon: '🚀' },
    { id: 'social', label: '社交任务', icon: '👥' },
    { id: 'daily', label: '每日任务', icon: '📅' },
    { id: 'content', label: '内容任务', icon: '📝' },
    { id: 'special', label: '特殊任务', icon: '⭐' }
  ];

  // ========== 工具函数 ==========
  function getTaskCountByStatus(status: string): number {
    return allTasks.filter(t => t.status === status).length;
  }

  function getCategoryName(categoryId: string): string {
    return categories.find(c => c.id === categoryId)?.label || categoryId;
  }
</script>

<main class="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 selection:bg-primary-500/30">
  <!-- 导航栏 -->
  <Navbar onLoginClick={handleLoginClick} />

  <!-- 登录模态框 -->
  <LoginModal isOpen={showLoginModal} onClose={handleCloseModal} />

  <!-- 主内容区域 -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
    <!-- ========== 欢迎区域 ========== -->
    <div class="mb-16">
      {#if user}
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 class="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              欢迎回来，<span class="bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">{user.username || user.address?.slice(0, 6) + '...'}</span>
            </h1>
            <p class="text-lg text-slate-400 max-w-2xl">继续完成任务，赚取更多奖励。你当前的表现非常出色！</p>
          </div>
          {#if stats.totalEarned > 0}
            <div class="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-100 px-6 py-4 backdrop-blur-sm">
              <div class="rounded-full bg-amber-500/10 p-3">
                <Trophy class="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <div class="text-2xl font-bold text-white">{stats.totalEarned}</div>
                <div class="text-sm text-slate-400">已获得奖励</div>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="text-center py-12 relative">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          <h1 class="text-5xl sm:text-7xl font-bold text-white tracking-tight mb-6">
            任务中心
          </h1>
          <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            完成任务，赚取奖励。开启你的 Web3 之旅，探索无限可能。
          </p>
          <button
            on:click={handleLoginClick}
            class="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-lg transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1"
          >
            开始探索
          </button>
        </div>
      {/if}
    </div>

    <!-- ========== 统计卡片 ========== -->
    {#if stats}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
        <StatCard
          title="已完成任务"
          value={stats.totalCompleted}
          subtitle="{getTaskCountByStatus('completed')} 待领取"
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="总计奖励"
          value={stats.totalEarned}
          subtitle="已领取"
          icon={Trophy}
          color="purple"
        />
        <StatCard
          title="活跃任务"
          value={stats.activeCount}
          subtitle="可继续完成"
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="完成率"
          value="{stats.completionRate}%"
          subtitle="总体进度"
          icon={Zap}
          color="pink"
        />
      </div>
    {/if}

    <!-- ========== 过滤和排序控制 ========== -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white tracking-tight">任务列表</h2>
        <button
          on:click={() => (showFilters = !showFilters)}
          class="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/5 bg-surface-100 hover:bg-surface-200 text-slate-300 transition-all"
        >
          <Filter class="w-4 h-4" />
          <span class="text-sm font-medium">筛选 & 排序</span>
        </button>
      </div>

      <!-- 分类过滤按钮 -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          on:click={() => handleCategoryFilter(null)}
          class={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
              : 'bg-surface-100 text-slate-400 hover:bg-surface-200 hover:text-slate-200'
          }`}
        >
          全部任务
        </button>
        {#each categories as category}
          <button
            on:click={() => handleCategoryFilter(category.id)}
            class={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              selectedCategory === category.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                : 'bg-surface-100 text-slate-400 hover:bg-surface-200 hover:text-slate-200'
            }`}
          >
            <span>{category.icon}</span>
            {category.label}
          </button>
        {/each}
      </div>

      <!-- 高级筛选面板 -->
      {#if showFilters}
        <div class="animate-in slide-in-from-top-2 bg-surface-100 border border-white/5 rounded-xl p-6 mb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-2">排序方式</label>
              <select
                bind:value={sortBy}
                class="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              >
                <option value="reward">按奖励（高→低）</option>
                <option value="deadline">按截止时间</option>
                <option value="category">按分类</option>
              </select>
            </div>
          </div>
          <div class="mt-6 flex justify-end border-t border-white/5 pt-4">
            <button
              on:click={clearFilters}
              class="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              清除所有筛选
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ========== 错误提示 ========== -->
    {#if error}
      <div class="mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <X class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div class="font-semibold text-red-400">错误</div>
          <div class="text-red-400/80 text-sm">{error}</div>
        </div>
        <button
          on:click={() => taskStore.clearError()}
          class="ml-auto text-red-400 hover:text-red-300"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    {/if}

    <!-- ========== 加载状态 ========== -->
    {#if loading}
      <div class="space-y-4">
        {#each { length: 3 } as _}
          <div class="animate-pulse">
            <div class="h-32 bg-surface-100 rounded-2xl border border-white/5"></div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- ========== 任务列表 ========== -->
    {#if !loading}
      {#if filteredAndSortedTasks.length === 0}
        <div class="text-center py-20 bg-surface-50 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div class="mx-auto w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6">
            <Trophy class="w-10 h-10 text-slate-600" />
          </div>
          <p class="text-slate-300 text-xl font-medium mb-2">暂无任务</p>
          <p class="text-slate-500 text-sm max-w-xs mx-auto">
            {#if selectedCategory}
              该分类下暂无任务，请尝试其他分类
            {:else}
              目前没有可用的任务，请稍后再来看看
            {/if}
          </p>
          {#if selectedCategory}
            <button
              on:click={() => handleCategoryFilter(null)}
              class="mt-6 text-primary-400 hover:text-primary-300 text-sm font-medium"
            >
              查看所有任务
            </button>
          {/if}
        </div>
      {:else}
        <div class="grid gap-4 mb-16">
          {#each filteredAndSortedTasks as task (task.id)}
            <TaskCard
              {task}
              onClaim={(taskId) => handleClaimReward(new CustomEvent('detail', { detail: taskId }))}
            />
          {/each}
        </div>
      {/if}
    {/if}

    <!-- ========== 登录提示 (底部) ========== -->
    {#if !user && !loading && filteredAndSortedTasks.length > 0}
      <div class="mt-12 bg-gradient-to-r from-primary-900/20 to-indigo-900/20 border border-primary-500/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full bg-primary-500/5 backdrop-blur-sm -z-10"></div>
        <Trophy class="w-12 h-12 mx-auto text-primary-400 mb-6" />
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4">准备好开始了吗？</h2>
        <p class="text-slate-400 mb-8 max-w-md mx-auto text-lg">
          登录你的钱包账户，完成任务，获得丰厚奖励。
        </p>
        <button
          on:click={handleLoginClick}
          class="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          立即登录
        </button>
      </div>
    {/if}

    <!-- ========== 页脚信息 ========== -->
    {#if user && filteredAndSortedTasks.length > 0}
      <div class="mt-16 pt-8 border-t border-white/5 text-center text-sm text-slate-500">
        <p>已显示 {filteredAndSortedTasks.length} 项任务</p>
        {#if selectedCategory}
          <p class="mt-1">分类：{getCategoryName(selectedCategory)}</p>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>
  /* Custom scrollbar for this page if needed, though global styles should cover it */
</style>