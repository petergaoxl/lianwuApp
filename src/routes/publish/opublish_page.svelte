<script lang="ts">
  import { onMount } from 'svelte';
  import { Send, AlertCircle, CheckCircle, Plus, X } from 'lucide-svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { taskStore } from '$lib/stores/task.store';
  import type { TaskCategory } from '$lib/types/task.types';

  // ========== 状态管理 ==========
  let showLoginModal = false;
  let formData = {
    title: '',
    description: '',
    reward: 100,
    category: 'onboarding' as TaskCategory,
    requirements: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  };

  let newRequirement = '';
  let isSubmitting = false;
  let submitError = '';
  let submitSuccess = false;
  let successMessage = '';

  // 订阅存储
  $: user = $authStore.user;

  // ========== 生命周期 ==========
  onMount(() => {
    // 页面加载时的初始化
    if (!user) {
      console.log('用户未登录，需要登录');
    }
  });

  // ========== 事件处理 ==========
  function handleLoginClick() {
    showLoginModal = true;
  }

  function handleCloseModal() {
    showLoginModal = false;
  }

  function addRequirement() {
    if (newRequirement.trim()) {
      formData.requirements = [...formData.requirements, newRequirement.trim()];
      newRequirement = '';
    }
  }

  function removeRequirement(index: number) {
    formData.requirements = formData.requirements.filter((_, i) => i !== index);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!user) {
      showLoginModal = true;
      return;
    }

    // 验证表单
    if (!formData.title.trim()) {
      submitError = '请输入任务标题';
      return;
    }

    if (!formData.description.trim()) {
      submitError = '请输入任务描述';
      return;
    }

    if (formData.reward <= 0) {
      submitError = '奖励金额必须大于0';
      return;
    }

    if (!formData.endDate) {
      submitError = '请选择任务截止日期';
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      submitError = '截止日期必须晚于开始日期';
      return;
    }

    submitError = '';
    isSubmitting = true;

    try {
      // 创建任务对象
      const newTask = {
        id: `task_${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        reward: formData.reward,
        category: formData.category,
        status: 'active' as const,
        progress: 0,
        total: formData.requirements.length || 1,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        requirements: formData.requirements
      };

      // 这里应该调用 taskStore 的发布任务方法
      // 暂时模拟成功
      await new Promise(resolve => setTimeout(resolve, 1000));

      successMessage = `任务"${formData.title}"已成功发布！`;
      submitSuccess = true;

      // 重置表单
      formData = {
        title: '',
        description: '',
        reward: 100,
        category: 'onboarding',
        requirements: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      };

      // 2秒后隐藏成功提示
      setTimeout(() => {
        submitSuccess = false;
      }, 3000);

      console.log('✅ 任务已发布:', newTask);
    } catch (err) {
      submitError = `发布失败: ${err instanceof Error ? err.message : '未知错误'}`;
      console.error('❌ 发布任务失败:', err);
    } finally {
      isSubmitting = false;
    }
  }

  // ========== 分类定义 ==========
  const categories = [
    { id: 'onboarding', label: '入门任务', icon: '🚀' },
    { id: 'social', label: '社交任务', icon: '👥' },
    { id: 'daily', label: '每日任务', icon: '📅' },
    { id: 'content', label: '内容任务', icon: '📝' },
    { id: 'special', label: '特殊任务', icon: '⭐' }
  ];
</script>

<main class="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
  <!-- 导航栏 -->
  <Navbar onLoginClick={handleLoginClick} />

  <!-- 登录模态框 -->
  <LoginModal isOpen={showLoginModal} onClose={handleCloseModal} />

  <!-- 主内容区域 -->
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- ========== 未登录状态 ========== -->
    {#if !user}
      <div class="text-center py-16">
        <AlertCircle class="w-16 h-16 mx-auto text-yellow-400 mb-4 opacity-70" />
        <h2 class="text-2xl font-bold text-white mb-3">需要登录</h2>
        <p class="text-gray-400 mb-8 max-w-md mx-auto">
          请先连接你的钱包账户，然后才能发布任务。
        </p>
        <button
          on:click={handleLoginClick}
          class="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          立即连接钱包
        </button>
      </div>
    {/if}

    <!-- ========== 已登录 - 发布表单 ========== -->
    {#if user}
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          发布新任务
        </h1>
        <p class="text-gray-400">创建并发布新的自由职业任务，吸引优秀的任务完成者</p>
      </div>

      <!-- 成功提示 -->
      {#if submitSuccess}
        <div class="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top">
          <CheckCircle class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div class="font-semibold text-green-400">发布成功</div>
            <div class="text-green-300 text-sm">{successMessage}</div>
          </div>
        </div>
      {/if}

      <!-- 错误提示 -->
      {#if submitError}
        <div class="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <div class="font-semibold text-red-400">发布失败</div>
            <div class="text-red-300 text-sm">{submitError}</div>
          </div>
          <button
            on:click={() => (submitError = '')}
            class="text-red-400 hover:text-red-300 flex-shrink-0"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      {/if}

      <!-- 主表单 -->
      <form on:submit={handleSubmit} class="space-y-6">
        <!-- 基础信息卡片 -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <div class="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            基础信息
          </h2>

          <div class="space-y-4">
            <!-- 任务标题 -->
            <div>
              <label for="title" class="block text-sm font-medium text-gray-300 mb-2">
                任务标题 <span class="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                bind:value={formData.title}
                placeholder="例如：在Twitter上分享我们的项目"
                maxlength="100"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
              />
              <div class="mt-1 text-xs text-gray-500 text-right">
                {formData.title.length}/100
              </div>
            </div>

            <!-- 任务描述 -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-300 mb-2">
                任务描述 <span class="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                bind:value={formData.description}
                placeholder="详细描述任务的内容、要求和期望结果..."
                maxlength="1000"
                rows="5"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all resize-none"
              ></textarea>
              <div class="mt-1 text-xs text-gray-500 text-right">
                {formData.description.length}/1000
              </div>
            </div>

            <!-- 任务分类 -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-300 mb-2">
                任务分类 <span class="text-red-400">*</span>
              </label>
              <select
                id="category"
                bind:value={formData.category}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
              >
                {#each categories as cat}
                  <option value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                {/each}
              </select>
            </div>
          </div>
        </div>

        <!-- 奖励和时间卡片 -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <div class="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
            奖励和时间
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- 奖励金额 -->
            <div>
              <label for="reward" class="block text-sm font-medium text-gray-300 mb-2">
                奖励金额 (TOKENS) <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="reward"
                  type="number"
                  bind:value={formData.reward}
                  min="1"
                  max="100000"
                  placeholder="100"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
                />
              </div>
            </div>

            <!-- 开始日期 -->
            <div>
              <label for="startDate" class="block text-sm font-medium text-gray-300 mb-2">
                开始日期 <span class="text-red-400">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                bind:value={formData.startDate}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
              />
            </div>

            <!-- 截止日期 -->
            <div>
              <label for="endDate" class="block text-sm font-medium text-gray-300 mb-2">
                截止日期 <span class="text-red-400">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                bind:value={formData.endDate}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- 任务要求卡片 -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <div class="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            任务要求 <span class="text-xs text-gray-400 font-normal">(可选)</span>
          </h2>

          <div class="space-y-4">
            <!-- 添加要求输入框 -->
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={newRequirement}
                placeholder="输入一个任务要求，按Enter添加"
                class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
              />
              <button
                type="button"
                on:click={addRequirement}
                class="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all flex items-center gap-2 flex-shrink-0"
              >
                <Plus class="w-4 h-4" />
                <span class="hidden sm:inline">添加</span>
              </button>
            </div>

            <!-- 要求列表 -->
            {#if formData.requirements.length > 0}
              <div class="space-y-2">
                {#each formData.requirements as req, index (index)}
                  <div class="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <div class="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex-shrink-0"></div>
                      <span class="text-gray-300 text-sm truncate">{req}</span>
                    </div>
                    <button
                      type="button"
                      on:click={() => removeRequirement(index)}
                      class="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {/each}
              </div>

              <div class="text-xs text-gray-500 text-right">
                已添加 {formData.requirements.length} 个要求
              </div>
            {:else}
              <div class="text-center py-4 text-gray-500 text-sm">
                暂无要求，可选项
              </div>
            {/if}
          </div>
        </div>

        <!-- 发布按钮 -->
        <div class="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            class="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {#if isSubmitting}
              <div class="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              <span>发布中...</span>
            {:else}
              <Send class="w-5 h-5" />
              <span>发布任务</span>
            {/if}
          </button>

          <a
            href="/"
            class="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10 hover:border-white/20"
          >
            返回
          </a>
        </div>

        <!-- 提示信息 -->
        <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <p class="text-sm text-blue-300">
            💡 发布任务后，将自动显示在任务列表中。请确保所有信息准确无误。
          </p>
        </div>
      </form>
    {/if}
  </div>
</main>

<style>
  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }
</style>
