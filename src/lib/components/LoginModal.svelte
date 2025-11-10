<script lang="ts">
  import { X } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.store';
  
  export let isOpen = false;
  export let onClose: () => void;
  
  const loginMethods = [
    { name: 'Google', icon: '🔍', color: 'from-red-500 to-yellow-500' },
    { name: 'Twitter', icon: '🐦', color: 'from-blue-400 to-blue-600' },
    { name: 'Discord', icon: '💬', color: 'from-indigo-500 to-purple-600' },
    { name: 'MetaMask', icon: '🦊', color: 'from-orange-400 to-orange-600' },
    { name: 'WalletConnect', icon: '🔗', color: 'from-blue-500 to-cyan-500' },
    { name: 'Email', icon: '📧', color: 'from-gray-500 to-gray-700' }
  ];
  
  async function handleLogin(method: string) {
    try {
      // TODO: 集成 Web3Auth 服务
      // await web3AuthService.login();
      
      // 模拟登录
      authStore.setLoading(true);
      
      setTimeout(() => {
        authStore.setUser({
          name: 'Demo User',
          email: 'demo@example.com',
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab',
          balance: '1.5',
        });
        authStore.setLoading(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('登录失败:', err);
      authStore.setError('登录失败，请重试');
      authStore.setLoading(false);
    }
  }
  
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl animate-in zoom-in duration-200">
      <!-- 标题栏 -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold mb-2">连接账号</h2>
          <p class="text-gray-400">选择一种方式登录平台</p>
        </div>
        <button
          on:click={onClose}
          class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
          aria-label="关闭"
          tabindex="0"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- 登录方式网格 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        {#each loginMethods as method}
          <button
            on:click={() => handleLogin(method.name)}
            class="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            tabindex="0"
          >
            <div class="text-4xl mb-2 group-hover:scale-110 transition-transform" role="img" aria-label={method.name}>{method.icon}</div>
            <div class="text-sm font-semibold">{method.name}</div>
          </button>
        {/each}
      </div>
      
      <!-- 取消按钮 -->
      <button
        on:click={onClose}
        class="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        tabindex="0"
      >
        取消
      </button>
      
      <!-- 加载状态 -->
      {#if $authStore.isLoading}
        <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-300">正在连接...</p>
          </div>
        </div>
      {/if}
      
      <!-- 错误提示 -->
      {#if $authStore.error}
        <div class="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {$authStore.error}
        </div>
      {/if}
    </div>
  </div>
{/if}