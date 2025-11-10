<script lang="ts">
  import { onMount } from 'svelte';
  import { Trophy, CheckCircle, Clock } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { taskStore } from '$lib/stores/task.store';
  
  let showLoginModal = false;
  
  $: user = $authStore.user;
  $: tasks = $taskStore.tasks;
  $: completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'claimed').length;
  $: activeCount = tasks.filter(t => t.status === 'active').length;
  $: totalEarned = tasks
    .filter(t => t.status === 'claimed')
    .reduce((sum, t) => sum + t.reward, 0);
  
  onMount(() => {
    taskStore.loadTasks();
  });
  
  function handleLoginClick() {
    showLoginModal = true;
  }
  
  function handleCloseModal() {
    showLoginModal = false;
    authStore.clearError();
  }
  
  async function handleClaimReward(taskId: string) {
    const success = await taskStore.claimReward(taskId);
    if (success) {
      console.log('奖励领取成功！');
    }
  }
</script>

<svelte:head>
  <title>TaskReward - Web3 任务奖励平台</title>
  <meta name="description" content="完成任务，赚取代币奖励" />
</svelte:head>

<div class="min-h-screen">
  <!-- 导航栏 -->
  <Navbar onLoginClick={handleLoginClick} />
  
  <!-- 主内容 -->
  <main class="relative z-10 max-w-7xl mx-auto px-6 py-12">
    {#if !user}
      <!-- 未登录状态 - 欢迎页面 -->
      <div class="text-center py-20">
        <div class="mb-8 flex justify-center">
          <div class="w-24 h-24 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center animate-pulse shadow-2xl shadow-purple-500/40">
            <Trophy class="w-12 h-12" />
          </div>
        </div>
        
        <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          完成任务，赚取代币奖励
        </h1>
        
        <p class="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          使用社交账号或加密钱包登录，开始你的 Web3 旅程。<br />
          完成各种任务，获得代币奖励，参与去中心化经济。
        </p>
        
        <button
          on:click={handleLoginClick}
          class="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all font-bold text-lg shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60"
        >
          立即开始
        </button>
        
        <!-- 特性介绍 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          <div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div class="text-4xl mb-4">🔐</div>
            <h3 class="text-lg font-semibold mb-2">多种登录方式</h3>
            <p class="text-sm text-gray-400">支持社交账号和加密钱包</p>
          </div>
          
          <div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div class="text-4xl mb-4">📋</div>
            <h3 class="text-lg font-semibold mb-2">丰富的任务</h3>
            <p class="text-sm text-gray-400">每日更新，多种类型可选</p>
          </div>
          
          <div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div class="text-4xl mb-4">💰</div>
            <h3 class="text-lg font-semibold mb-2">即时奖励</h3>
            <p class="text-sm text-gray-400">完成即可领取代币奖励</p>
          </div>
        </div>
      </div>
    {:else}
      <!-- 已登录状态 - 任务面板 -->
      <div>
        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="总收益"
            value={totalEarned}
            subtitle="Tokens"
            icon={Trophy}
            color="purple"
          />
          
          <StatCard
            title="已完成"
            value={completedCount}
            subtitle="任务"
            icon={CheckCircle}
            color="cyan"
          />
          
          <StatCard
            title="进行中"
            value={activeCount}
            subtitle="任务"
            icon={Clock}
            color="pink"
          />
        </div>
        
        <!-- 任务列表 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">可用任务</h2>
            <span class="text-sm text-gray-400">{tasks.length} 个任务</span>
          </div>
          
          {#if tasks.length > 0}
            {#each tasks as task (task.id)}
              <TaskCard {task} onClaim={handleClaimReward} />
            {/each}
          {:else}
            <div class="text-center py-12 text-gray-400">
              <p>暂无可用任务</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>
  
  <!-- 登录弹窗 -->
  <LoginModal isOpen={showLoginModal} onClose={handleCloseModal} />
</div>