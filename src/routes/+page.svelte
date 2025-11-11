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
    { id: 'onboarding', label: '入门任务', color: 'from-green-400 to-emerald-500', icon: '🚀' },
    { id: 'social', label: '社交任务', color: 'from-purple-400 to-pink-500', icon: '👥' },
    { id: 'daily', label: '每日任务', color: 'from-blue-400 to-cyan-500', icon: '📅' },
    { id: 'content', label: '内容任务', color: 'from-orange-400 to-red-500', icon: '📝' },
    { id: 'special', label: '特殊任务', color: 'from-yellow-400 to-amber-500', icon: '⭐' }
  ];

  // ========== 工具函数 ==========
  function getTaskCountByStatus(status: string): number {
    return allTasks.filter(t => t.status === status).length;
  }

  function getCategoryName(categoryId: string): string {
    return categories.find(c => c.id === categoryId)?.label || categoryId;
  }
</script>

<main class="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
  <!-- 导航栏 -->
  <Navbar onLoginClick={handleLoginClick} />

  <!-- 登录模态框 -->
  <LoginModal isOpen={showLoginModal} onClose={handleCloseModal} />

  <!-- 主内容区域 -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- ========== 欢迎区域 ========== -->
    <div class="mb-12">
      {#if user}
        <div class="flex items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              欢迎回来，{user.username || user.address?.slice(0, 10) + '...'}
            </h1>
            <p class="text-gray-400 mt-2">继续完成任务，赚取更多奖励</p>
          </div>
          {#if stats.totalEarned > 0}
            <div class="text-right">
              <div class="text-3xl font-bold text-yellow-400">{stats.totalEarned}</div>
              <div class="text-sm text-gray-400">已获得奖励</div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="text-center py-8">
          <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            任务中心
          </h1>
          <p class="text-gray-400 mt-2 text-lg">完成任务，赚取奖励</p>
        </div>
      {/if}
    </div>

    <!-- ========== 统计卡片 ========== -->
    {#if stats}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
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
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-white">任务列表</h2>
        <button
          on:click={() => (showFilters = !showFilters)}
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Filter class="w-4 h-4" />
          <span class="text-sm">筛选</span>
        </button>
      </div>

      <!-- 分类过滤按钮 -->
      <div class="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
        <button
          on:click={() => handleCategoryFilter(null)}
          class={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          全部任务
        </button>
        {#each categories as category}
          <button
            on:click={() => handleCategoryFilter(category.id)}
            class={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {category.icon} {category.label}
          </button>
        {/each}
      </div>

      <!-- 高级筛选面板 -->
      {#if showFilters}
        <div class="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">排序方式</label>
              <select
                bind:value={sortBy}
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="reward">按奖励（高→低）</option>
                <option value="deadline">按截止时间</option>
                <option value="category">按分类</option>
              </select>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              on:click={clearFilters}
              class="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              清除所有筛选
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ========== 错误提示 ========== -->
    {#if error}
      <div class="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
        <X class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div class="font-semibold text-red-400">错误</div>
          <div class="text-red-300 text-sm">{error}</div>
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
            <div class="h-24 bg-white/10 rounded-2xl"></div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- ========== 任务列表 ========== -->
    {#if !loading}
      {#if filteredAndSortedTasks.length === 0}
        <div class="text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <Trophy class="w-16 h-16 mx-auto text-gray-500 mb-4 opacity-50" />
          <p class="text-gray-400 text-lg font-medium">暂无任务</p>
          <p class="text-gray-500 text-sm mt-1">
            {#if selectedCategory}
              该分类下暂无任务
            {:else}
              所有任务都已完成或不可用
            {/if}
          </p>
          {#if selectedCategory}
            <button
              on:click={() => handleCategoryFilter(null)}
              class="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              查看其他任务
            </button>
          {/if}
        </div>
      {:else}
        <div class="space-y-4 mb-12">
          {#each filteredAndSortedTasks as task (task.id)}
            <TaskCard
              {task}
              onClaim={(taskId) => handleClaimReward(new CustomEvent('detail', { detail: taskId }))}
            />
          {/each}
        </div>
      {/if}
    {/if}

    <!-- ========== 登录提示 ========== -->
    {#if !user && !loading}
      <div class="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
        <Trophy class="w-12 h-12 mx-auto text-purple-400 mb-4" />
        <h2 class="text-2xl font-bold text-white mb-2">开始赚取奖励</h2>
        <p class="text-gray-300 mb-6 max-w-md mx-auto">
          登录你的钱包账户，完成任务，获得丰厚奖励。
        </p>
        <button
          on:click={handleLoginClick}
          class="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          现在登录
        </button>
      </div>
    {/if}

    <!-- ========== 页脚信息 ========== -->
    {#if user && filteredAndSortedTasks.length > 0}
      <div class="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
        <p>已显示 {filteredAndSortedTasks.length} 项任务</p>
        {#if selectedCategory}
          <p class="mt-1">分类：{getCategoryName(selectedCategory)}</p>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    min-height: 100vh;
  }

  ::-webkit-scrollbar {
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>