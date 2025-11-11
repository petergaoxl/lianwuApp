<script lang="ts">
  import { X, CheckCircle } from 'lucide-svelte';
  import { authStore, type User } from '$lib/stores/auth.store';

  export let isOpen = false;
  export let onClose: () => void;

  let showSuccess = false;
  let successMessage = '';

  // 这里用 key 来区分逻辑，label 只是显示用
  const loginMethods = [
    {
      key: 'social' as const,
      label: 'Social Login',
      icon: '🔍',
      color: 'from-red-500 to-yellow-500'
    },
    {
      key: 'metamask' as const,
      label: 'MetaMask',
      icon: '🦊',
      color: 'from-orange-400 to-orange-600'
    }
  ];

  type LoginButtonKey = 'social' | 'metamask';

  async function handleLogin(key: LoginButtonKey) {
    authStore.clearError();
    showSuccess = false;

    let user: User | null = null;

    if (key === 'social') {
      // ✅ 社交登录按钮 → 只走 Web3Auth 分支（在 Web3Auth 弹窗里可以选 Google / Discord 等）
      console.log('🔵 LoginModal: 点击了社交登录按钮');
      user = await authStore.loginWithWeb3Auth('Google');
    } else if (key === 'metamask') {
      // ✅ MetaMask 按钮 → 只走 MetaMask 分支
      console.log('🟠 LoginModal: 点击了 MetaMask 按钮');
      user = await authStore.loginWithWeb3Auth('metamask');
    }

    if (user) {
      showSuccess = true;
      const shortAddress = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
      // 根据 loginMethod 显示具体来源
      const source =
        user.loginMethod === 'metamask'
          ? 'MetaMask'
          : user.loginMethod === 'discord'
          ? 'Discord'
          : '社交账号';

      successMessage = `${source} 登录成功！地址: ${shortAddress}`;

      setTimeout(() => {
        showSuccess = false;
        onClose();
      }, 1500);
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !$authStore.isLoading) {
      onClose();
    }
  }
</script>

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
            on:click={() => handleLogin(method.key)}
            disabled={$authStore.isLoading}
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{method.icon}</span>
              <span class="font-semibold">{method.label}</span>
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
        class="w-full rounded-xl border border-white/10 bg-white/5 py-3 transition-all hover:bg-white/10 disabled:opacity-50"
        disabled={$authStore.isLoading}
        tabindex="0"
      >
        取消
      </button>

      <!-- 成功提示 -->
      {#if showSuccess}
        <div
          class="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-900/95 backdrop-blur-sm"
        >
          <div class="text-center px-8">
            <div class="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle class="h-10 w-10 text-green-400" />
            </div>
            <p class="text-xl font-bold text-green-400 mb-2">登录成功！</p>
            <p class="text-sm text-gray-300">{successMessage}</p>
          </div>
        </div>
      {/if}

      <!-- 全屏加载遮罩 -->
      {#if $authStore.isLoading}
        <div
          class="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-900/80 backdrop-blur-sm"
        >
          <div class="text-center">
            <div
              class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"
            ></div>
            <p class="text-gray-300">正在连接钱包...</p>
            <p class="text-xs text-gray-500 mt-2">请在弹出的窗口中完成登录</p>
          </div>
        </div>
      {/if}

      <!-- 错误提示 -->
      {#if $authStore.error}
        <div
          class="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <p class="font-semibold mb-1">❌ 登录失败</p>
          <p>{$authStore.error}</p>
        </div>
      {/if}
    </div>
  </div>
{/if}
