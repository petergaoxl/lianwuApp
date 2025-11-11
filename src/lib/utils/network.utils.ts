// src/lib/utils/network.utils.ts
import { TAIKO_HOOLIGAN_CONFIG } from '$lib/config/web3auth';

export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export async function getCurrentChainId(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;
  try {
    const chainId = await window.ethereum!.request({ method: 'eth_chainId' }) as string;
    return chainId;
  } catch (error) {
    console.error('获取当前网络失败:', error);
    return null;
  }
}

export async function switchToTaikoNetwork(): Promise<boolean> {
  if (!isMetaMaskInstalled()) {
    throw new Error('请先安装 MetaMask 钱包');
  }

  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TAIKO_HOOLIGAN_CONFIG.chainIdHex }]
    });
    console.log('✅ 已切换到 Taiko Hooligan 测试网');
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: TAIKO_HOOLIGAN_CONFIG.chainIdHex,
            chainName: TAIKO_HOOLIGAN_CONFIG.name,
            nativeCurrency: TAIKO_HOOLIGAN_CONFIG.nativeCurrency,
            rpcUrls: TAIKO_HOOLIGAN_CONFIG.rpcUrls,
            blockExplorerUrls: TAIKO_HOOLIGAN_CONFIG.blockExplorerUrls
          }]
        });
        console.log('✅ 已添加 Taiko Hooligan 测试网');
        return true;
      } catch (addError) {
        throw new Error('无法添加 Taiko Hooligan 测试网');
      }
    } else {
      throw new Error('切换网络失败');
    }
  }
}

export function onChainChanged(callback: (chainId: string) => void): () => void {
  if (!isMetaMaskInstalled()) return () => {};
  const handler = (chainId: string) => callback(chainId);
  window.ethereum!.on('chainChanged', handler);
  return () => window.ethereum!.removeListener('chainChanged', handler);
}

export function getNetworkName(chainId: string): string {
  const chainIdNum = parseInt(chainId, 16);
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia',
    167013: 'Taiko Hooligan'
  };
  return networks[chainIdNum] || `Unknown (${chainIdNum})`;
}