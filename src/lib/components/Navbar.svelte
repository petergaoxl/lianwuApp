<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Wallet, Trophy, Zap, LogOut, Network, CheckCircle } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { onChainChanged, getNetworkName } from '$lib/utils/network.utils';
	import { TAIKO_HOODI_CONFIG } from '$lib/config/web3auth';
	import { getTaikoEthBalance } from '$lib/services/balance.service';

	export let onLoginClick: () => void;

	let balance = 0; // 改成数字
	let currentNetwork = 'Taiko Hoodi';
	let isCorrectNetwork = true;
	let unsubscribeChainChanged: (() => void) | null = null;
	let showLogoutToast = false;

	$: user = $authStore.user;
	$: isLoading = $authStore.isLoading;

	onMount(async () => {
		if (typeof window !== 'undefined' && (window as any).ethereum) {
			const chainId = (await (window as any).ethereum.request({ method: 'eth_chainId' })) as string;
			currentNetwork = getNetworkName(chainId);
			isCorrectNetwork = chainId === TAIKO_HOODI_CONFIG.chainIdHex;

			unsubscribeChainChanged = onChainChanged((chainId) => {
				currentNetwork = getNetworkName(chainId);
				isCorrectNetwork = chainId === TAIKO_HOODI_CONFIG.chainIdHex;
			});
		}
	});

	onDestroy(() => {
		if (unsubscribeChainChanged) unsubscribeChainChanged();
	});

	// 🔄 当登录用户变化时，自动刷新 Taiko 上的 ETH 余额
	$: if (user?.address) {
		refreshBalance(user.address);
	} else {
		balance = 0;
	}

	let lastAddress = '';

async function refreshBalance(address: string) {
  if (!address || address === lastAddress) return;
  lastAddress = address;

  try {
    const ethNum = await getTaikoEthBalance(address);
    balance = ethNum;
  } catch (e) {
    console.error('获取 Taiko ETH 余额失败:', e);
    balance = 0;
  }
}


	async function handleLogout() {
		if (isLoading) return;
		await authStore.logout();

		balance = 0;
        lastAddress = ''; 
		currentNetwork = 'Taiko Hoodi';
		isCorrectNetwork = true;

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

<nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/60">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<a href="/" class="flex items-center gap-3 transition-opacity hover:opacity-80">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/20"
			>
				<Zap class="h-5 w-5 text-white" />
			</div>
			<span
				class="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent"
			>
				Lianwu
			</span>
		</a>

		<div class="flex items-center gap-3">
			{#if user}
				<div
					class="hidden sm:flex items-center gap-2 rounded-lg border border-white/5 bg-surface-100 px-3 py-1.5 backdrop-blur-sm"
				>
					<Network class="h-3.5 w-3.5 {isCorrectNetwork ? 'text-emerald-400' : 'text-amber-400'}" />
					<span class="text-xs font-medium text-slate-300">{currentNetwork}</span>
				</div>

				<div
					class="hidden sm:flex items-center gap-2 rounded-lg border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 backdrop-blur-sm"
				>
					<Trophy class="h-4 w-4 text-primary-400" />
					<span class="text-sm font-bold text-primary-100">
						{balance.toFixed(4)}
					</span>
					<span class="text-xs text-primary-300/70">ETH</span>
				</div>

				<div class="hidden sm:flex items-center gap-2 rounded-lg border border-white/5 bg-surface-100 px-3 py-1.5 backdrop-blur-sm">
					<Wallet class="h-3.5 w-3.5 text-slate-400" />
					<span class="font-mono text-xs text-slate-300">{formatAddress(user.address)}</span>
				</div>

				<button
					on:click={handleLogout}
					class="flex items-center gap-2 rounded-lg border border-white/5 bg-surface-100 px-3 py-1.5 text-slate-300 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
				>
					<LogOut class="h-3.5 w-3.5" />
					<span class="text-xs font-medium">登出</span>
				</button>
			{:else}
				<button
					on:click={onLoginClick}
					class="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-500 hover:shadow-primary-500/30"
				>
					连接钱包
				</button>
			{/if}
		</div>
	</div>
</nav>

<!-- 登出成功提示 Toast -->
{#if showLogoutToast}
	<div class="animate-in slide-in-from-right fixed right-6 top-24 z-50 duration-300">
		<div
			class="flex items-center gap-3 rounded-xl border border-green-500/30 bg-slate-900 px-6 py-4 shadow-xl backdrop-blur-sm"
		>
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
				<CheckCircle class="h-5 w-5 text-green-400" />
			</div>
			<div>
				<p class="font-semibold text-green-400">登出成功</p>
				<p class="text-sm text-gray-400">您已安全退出</p>
			</div>
		</div>
	</div>
{/if}
