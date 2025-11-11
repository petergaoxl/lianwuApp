// src/lib/services/token.service.ts
import { ethers } from 'ethers';

// ERC-20 代币 ABI（只包含必需的方法）
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export interface TokenBalance {
  balance: string;
  symbol: string;
  name: string;
  decimals: number;
  rawBalance: string;
}

class TokenService {
  /**
   * 获取 ERC-20 代币余额
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    provider: ethers.Provider
  ): Promise<TokenBalance | null> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      // 并行获取所有信息
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ]);

      const formattedBalance = ethers.formatUnits(balance, decimals);

      return {
        balance: formattedBalance,
        symbol,
        name,
        decimals,
        rawBalance: balance.toString()
      };
    } catch (error) {
      console.error('获取代币余额失败:', error);
      return null;
    }
  }

  /**
   * 获取原生代币（ETH）余额
   */
  async getNativeBalance(
    walletAddress: string,
    provider: ethers.Provider
  ): Promise<string> {
    try {
      const balance = await provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('获取原生代币余额失败:', error);
      return '0';
    }
  }

  /**
   * 获取多个代币余额
   */
  async getMultipleTokenBalances(
    tokenAddresses: string[],
    walletAddress: string,
    provider: ethers.Provider
  ): Promise<(TokenBalance | null)[]> {
    const promises = tokenAddresses.map(address =>
      this.getTokenBalance(address, walletAddress, provider)
    );
    return Promise.all(promises);
  }
}

export const tokenService = new TokenService();

// Taiko 网络常用代币地址（示例）
export const TAIKO_TOKENS = {
  // 如果有 TAIKO 代币合约地址，在这里添加
  // TAIKO: '0x...', 
  // USDC: '0x...',
  // USDT: '0x...',
};