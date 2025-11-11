// src/lib/services/balance.service.ts
import { JsonRpcProvider, formatEther } from 'ethers';
import { TAIKO_HOODI_CONFIG } from '$lib/config/web3auth';

// 用 Taiko Hoodi 的 RPC 创建一个只读 provider
const taikoProvider = new JsonRpcProvider(TAIKO_HOODI_CONFIG.rpcUrls[0]);

/**
 * 获取地址在 Taiko Hoodi 链上的 ETH 余额（单位：ETH，数字类型）
 */
export async function getTaikoEthBalance(address: string): Promise<number> {
  if (!address) throw new Error('地址不能为空');

  // ethers v6：getBalance 返回 bigint
  const balanceBigInt = await taikoProvider.getBalance(address);

  // 转成 ETH 字符串，然后再转成 number
  const ethStr = formatEther(balanceBigInt); // 例如 "0.123456789"
  const ethNum = Number(ethStr);

  // 为了避免 NaN，做一次兜底
  if (Number.isNaN(ethNum)) {
    console.warn('格式化 Taiko ETH 余额失败:', address, ethStr);
    return 0;
  }

  return ethNum;
}
