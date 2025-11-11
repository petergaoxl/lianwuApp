<script lang="ts">
  import { X } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.store';

  export let isOpen = false;
  export let onClose: () => void;

  const loginMethods = [
    { name: 'Google', icon: '🔍', color: 'from-red-500 to-yellow-500' },
    { name: 'MetaMask', icon: '🦊', color: 'from-orange-400 to-orange-600' },
    { name: 'Email', icon: '📧', color: 'from-gray-500 to-gray-700' }
  ];

  async function handleLogin(methodName: string) {
  authStore.clearError();

  let user: User | null = null;

  if (methodName === 'Google') {
    user = await authStore.loginWithWeb3Auth('google');
  } else if (methodName === 'MetaMask') {
    user = await authStore.loginWithWeb3Auth('metamask');
  } else {
    authStore.setError(`${methodName} 登录暂未实现，请先使用钱包登录`);
    return;
  }

  if (user) {
    onClose();
  } else {
    authStore.setError('登录失败，请稍后重试');
  }

  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }
</script>

<!-- 保留原 UI -->


{#if isOpen}
  <div
    class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-200"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="animate-in zoom-in mx-4 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl duration-200 relative"
    >
      <!-- 标题栏 -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="mb-2 text-2xl font-bold">连接账号</h2>
          <p class="text-gray-400">选择一种方式登录平台</p>
        </div>
        <button
          on:click={onClose}
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-white/10"
          aria-label="关闭"
          tabindex="0"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- 登录方式网格 -->
      <div class="mb-6 grid grid-cols-2 gap-4">
        {#each loginMethods as method}
          <button
            class={`flex w-full items-center justify-between rounded-xl bg-gradient-to-r p-4 ${method.color} transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed`}
            on:click={() => handleLogin(method.name)}
            disabled={$authStore.isLoading}
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{method.icon}</span>
              <span class="font-semibold">{method.name}</span>
            </div>
            {#if $authStore.isLoading}
              <span class="text-sm opacity-70">正在连接...</span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 取消按钮 -->
      <button
        on:click={onClose}
        class="w-full rounded-xl border border-white/10 bg-white/5 py-3 transition-all hover:bg-white/10"
        tabindex="0"
      >
        取消
      </button>

      <!-- 全屏加载遮罩 -->
      {#if $authStore.isLoading}
        <div
          class="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-900/80 backdrop-blur-sm"
        >
          <div class="text-center">
            <div
              class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
            ></div>
            <p class="text-gray-300">正在连接...</p>
          </div>
        </div>
      {/if}

      <!-- 错误提示 -->
      {#if $authStore.error}
        <div
          class="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {$authStore.error}
        </div>
      {/if}
    </div>
  </div>
{/if}
