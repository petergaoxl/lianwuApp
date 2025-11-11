<script lang="ts">
  import { Wallet, Trophy, Zap } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.store';
  
  export let onLoginClick: () => void;
  
  let balance = 450; // 临时硬编码，后续从 store 获取
  
  $: user = $authStore.user;
</script>

<nav class="relative z-10 border-b border-white/10 backdrop-blur-xl bg-black/20">
  <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
      <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
        <Zap class="w-6 h-6" />
      </div>
      <span class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        TaskReward
      </span>
    </a>
    
    <!-- 右侧按钮 -->
    <div class="flex items-center gap-4">
      {#if user}
        <!-- 代币余额 -->
        <div class="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 backdrop-blur-sm hover:from-purple-500/30 hover:to-cyan-500/30 transition-all">
          <div class="flex items-center gap-2">
            <Trophy class="w-5 h-5 text-yellow-400" />
            <span class="font-bold text-lg">{balance}</span>
            <span class="text-sm text-gray-400">Tokens</span>
          </div>
        </div>
        
        <!-- 钱包地址 -->
        <div class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
          <div class="flex items-center gap-2">
            <Wallet class="w-4 h-4 text-purple-400" />
            <span class="text-sm font-mono">{user.address}</span>
          </div>
        </div>
      {:else}
        <!-- 连接钱包按钮 -->
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