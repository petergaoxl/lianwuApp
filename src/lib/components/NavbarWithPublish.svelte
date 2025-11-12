<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Wallet, Trophy, Zap, LogOut, Network, CheckCircle, Plus } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { onChainChanged, getNetworkName } from '$lib/utils/network.utils';
	import { TAIKO_HOODI_CONFIG } from '$lib/config/web3auth';
	import { getTaikoEthBalance } from '$lib/services/balance.service';

	export let onLoginClick: () => void;

	let balance = 0;
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

<nav class="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<a href="/" class="flex items-center gap-3 transition-opacity hover:opacity-80">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/30"
			>
				<Zap class="h-6 w-6" />
			</div>
			<span
				class="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent"
			>
				Lianwu
			</span>
		</a>

		<div class="flex items-center gap-3">
			{#if user}
				<!-- 发布任务按钮 -->
				<a
					href="/publish"
					class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-2.5 font-semibold text-white transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
				>
					<Plus class="h-5 w-5" />
					<span class="hidden sm:inline">发布任务</span>
				</a>

				<div
					class="rounded-xl px-4 py-2 {isCorrectNetwork
						? 'border-green-500/30 bg-green-500/20'
						: 'border-yellow-500/30 bg-yellow-500/20'} border backdrop-blur-sm"
				>
					<div class="flex items-center gap-2">
						<Network class="h-4 w-4 {isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'}" />
						<span class="text-xs font-medium">{currentNetwork}</span>
					</div>
				</div>

				<div
					class="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-6 py-2 backdrop-blur-sm"
				>
					<div class="flex items-center gap-2">
						<Trophy class="h-5 w-5 text-yellow-400" />
						<span class="text-lg font-bold">
							{balance.toFixed(4)}
						</span>
						<span class="text-sm text-gray-400">ETH (Taiko)</span>
					</div>
				</div>

				<div class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
					<div class="flex items-center gap-2">
						<Wallet class="h-4 w-4 text-purple-400" />
						<span class="font-mono text-sm">{formatAddress(user.address)}</span>
					</div>
				</div>

				<button
					on:click={handleLogout}
					class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm transition-all hover:border-red-500/30 hover:bg-red-500/20"
				>
					<LogOut class="h-4 w-4" />
					<span class="text-sm font-medium">登出</span>
				</button>
			{:else}
				<button
					on:click={onLoginClick}
					class="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-2.5 font-semibold shadow-lg shadow-purple-500/30 transition-all hover:from-purple-600 hover:to-cyan-600 hover:shadow-purple-500/50"
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
