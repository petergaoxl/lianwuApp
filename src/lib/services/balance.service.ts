// src/lib/services/balance.service.ts
import { JsonRpcProvider, formatEther } from 'ethers';
import { TAIKO_HOODI_CONFIG } from '$lib/config/web3auth';

// 创建一个只读的 Taiko Provider（全局共用）
const taikoProvider = new JsonRpcProvider(TAIKO_HOODI_CONFIG.rpcUrls[0]);

/**
 * 读取某个地址在 Taiko 测试网的 ETH 余额（返回 string，单位 ETH）
 */
export async function getTaikoEthBalance(address: string): Promise<string> {
  if (!address) throw new Error('地址不能为空');

  const balanceBigInt = await taikoProvider.getBalance(address);
  const balanceEth = formatEther(balanceBigInt); // BigInt -> '0.123456789'
  return balanceEth;
}
