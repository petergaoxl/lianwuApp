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
    class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm duration-200"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="animate-in zoom-in mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-black/50 duration-200 relative backdrop-blur-xl"
    >
      <!-- 标题栏 -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h2 class="mb-1 text-2xl font-bold text-white tracking-tight">连接账号</h2>
          <p class="text-slate-400 text-sm">选择一种方式登录平台</p>
        </div>
        <button
          on:click={onClose}
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
          aria-label="关闭"
          tabindex="0"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- 登录方式网格 -->
      <div class="mb-6 space-y-3">
        {#each loginMethods as method}
          <button
            class={`group flex w-full items-center justify-between rounded-xl border border-white/5 p-4 transition-all hover:border-white/10 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed`}
            on:click={() => handleLogin(method.key)}
            disabled={$authStore.isLoading}
          >
            <div class="flex items-center gap-4">
              <div class={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${method.color} shadow-lg`}>
                <span class="text-lg">{method.icon}</span>
              </div>
              <span class="font-semibold text-slate-200 group-hover:text-white transition-colors">{method.label}</span>
            </div>
            {#if $authStore.isLoading}
              <span class="text-xs text-slate-500">正在连接...</span>
            {:else}
              <div class="h-2 w-2 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors"></div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 取消按钮 -->
      <button
        on:click={onClose}
        class="w-full rounded-xl border border-white/5 bg-transparent py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-slate-300 disabled:opacity-50"
        disabled={$authStore.isLoading}
        tabindex="0"
      >
        取消
      </button>

      <!-- 成功提示 -->
      {#if showSuccess}
        <div
          class="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/95 backdrop-blur-md"
        >
          <div class="text-center px-8">
            <div class="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle class="h-8 w-8 text-emerald-400" />
            </div>
            <p class="text-lg font-bold text-emerald-400 mb-2">登录成功！</p>
            <p class="text-sm text-slate-400">{successMessage}</p>
          </div>
        </div>
      {/if}

      <!-- 全屏加载遮罩 -->
      {#if $authStore.isLoading}
        <div
          class="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm"
        >
          <div class="text-center">
            <div
              class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
            ></div>
            <p class="text-slate-300 font-medium">正在连接钱包...</p>
            <p class="text-xs text-slate-500 mt-2">请在弹出的窗口中完成登录</p>
          </div>
        </div>
      {/if}

      <!-- 错误提示 -->
      {#if $authStore.error}
        <div
          class="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <div class="flex items-center gap-2 mb-1">
            <X class="h-4 w-4" />
            <span class="font-semibold">登录失败</span>
          </div>
          <p class="opacity-90">{$authStore.error}</p>
        </div>
      {/if}
    </div>
  </div>
{/if}
