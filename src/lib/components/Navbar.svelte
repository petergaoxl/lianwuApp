<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Wallet, Trophy, Zap, LogOut, Network, CheckCircle } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.store';
  import { onChainChanged, getNetworkName } from '$lib/utils/network.utils';
  import { TAIKO_HOODI_CONFIG as TAIKO_HOOLIGAN_CONFIG } from '$lib/config/web3auth'; // 如果你之前就是这么叫的，保持一致即可

  export let onLoginClick: () => void;

  let balance = 450;
  let currentNetwork = 'Taiko Hooligan';
  let isCorrectNetwork = true;
  let unsubscribeChainChanged: (() => void) | null = null;
  let showLogoutToast = false;

  // 从 authStore 里拿 user / isLoading
  $: user = $authStore.user;
  $: isLoading = $authStore.isLoading;

  onMount(async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' }) as string;
      currentNetwork = getNetworkName(chainId);
      isCorrectNetwork = chainId === TAIKO_HOOLIGAN_CONFIG.chainIdHex;

      unsubscribeChainChanged = onChainChanged((chainId) => {
        currentNetwork = getNetworkName(chainId);
        isCorrectNetwork = chainId === TAIKO_HOOLIGAN_CONFIG.chainIdHex;
      });
    }
  });

  onDestroy(() => {
    if (unsubscribeChainChanged) unsubscribeChainChanged();
  });

  async function handleLogout() {
    // 正在执行别的操作时避免重复触发
    if (isLoading) return;

    await authStore.logout();

    // 这里可选：重置一些展示用状态
    currentNetwork = 'Taiko Hooligan';
    isCorrectNetwork = true;
    // balance 看你业务逻辑，要不要重置
    // balance = 0;

    showLogoutToast = true;
    setTimeout(() => {
      showLogoutToast = false;
    }, 3000);
  }

  function formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
</script>


<nav class="relative z-10 border-b border-white/10 backdrop-blur-xl bg-black/20">
  <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
      <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
        <Zap class="w-6 h-6" />
      </div>
      <span class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        TaskReward
      </span>
    </a>
    
    <div class="flex items-center gap-3">
      {#if user}
        <div class="px-4 py-2 rounded-xl {isCorrectNetwork ? 'bg-green-500/20 border-green-500/30' : 'bg-yellow-500/20 border-yellow-500/30'} border backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <Network class="w-4 h-4 {isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'}" />
            <span class="text-xs font-medium">{currentNetwork}</span>
          </div>
        </div>
      
        <div class="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <Trophy class="w-5 h-5 text-yellow-400" />
            <span class="font-bold text-lg">{balance}</span>
            <span class="text-sm text-gray-400">Tokens</span>
          </div>
        </div>
        
        <div class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div class="flex items-center gap-2">
            <Wallet class="w-4 h-4 text-purple-400" />
            <span class="text-sm font-mono">{formatAddress(user.address)}</span>
          </div>
        </div>
        
        <button
          on:click={handleLogout}
          class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-red-500/20 hover:border-red-500/30 transition-all flex items-center gap-2"
        >
          <LogOut class="w-4 h-4" />
          <span class="text-sm font-medium">登出</span>
        </button>
      {:else}
        <button
          on:click={onLoginClick}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
        >
          连接钱包
        </button>
      {/if}
    </div>
  </div>
</nav>

<!-- 登出成功提示 Toast -->
{#if showLogoutToast}
  <div class="fixed top-24 right-6 z-50 animate-in slide-in-from-right duration-300">
    <div class="flex items-center gap-3 px-6 py-4 rounded-xl bg-slate-900 border border-green-500/30 shadow-xl backdrop-blur-sm">
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
        <CheckCircle class="w-5 h-5 text-green-400" />
      </div>
      <div>
        <p class="font-semibold text-green-400">登出成功</p>
        <p class="text-sm text-gray-400">您已安全退出</p>
      </div>
    </div>
  </div>
{/if}