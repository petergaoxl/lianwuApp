// src/lib/services/web3auth.service.ts
import { Web3Auth } from '@web3auth/modal';
import { ethers } from 'ethers';
import { getWeb3AuthConfig } from '$lib/config/web3auth';
import type { User } from '$lib/stores/auth.store';

class Web3AuthService {
  private isBrowser() {
    return typeof window !== 'undefined';
  }

  /**
   * 每次登录都重新创建并初始化一个 Web3Auth 实例
   */
  private async createWeb3Auth() {
    if (!this.isBrowser()) {
      throw new Error('Web3Auth 只能在浏览器环境中使用');
    }

    const cfg = getWeb3AuthConfig();
    console.log('[Web3Auth] create instance with config:', cfg);

    const web3auth = new Web3Auth({
      clientId: cfg.clientId,
      web3AuthNetwork: cfg.web3AuthNetwork ?? 'sapphire_devnet',
      chainConfig: cfg.chainConfig
    });

    const anyAuth = web3auth as any;

    if (typeof anyAuth.initModal === 'function') {
      await anyAuth.initModal();
    } else if (typeof anyAuth.init === 'function') {
      await anyAuth.init();
    } else {
      throw new Error('Web3Auth SDK 版本异常：未找到 init 或 initModal 方法');
    }

    return anyAuth as any;
  }

  /**
   * 登录（支持 google / metamask）
   */
  async connect(method: 'google' | 'metamask'): Promise<User> {
    // 1. 创建并初始化 Web3Auth
    const web3auth = await this.createWeb3Auth();

    // 2. 根据方式发起连接
    let provider: any;
    try {
      if (method === 'google') {
        provider = await web3auth.connectTo('openlogin', {
          loginProvider: 'google'
        });
      } else if (method === 'metamask') {
        provider = await web3auth.connectTo('metamask');
      } else {
        throw new Error('未知登录方式');
      }
    } catch (e) {
      console.error('[Web3Auth] connect error:', e);
      throw new Error('登录失败，请稍后重试');
    }

    if (!provider) {
      throw new Error('未获取到 Web3 provider');
    }

    // 3. 用 ethers 获取地址和余额
    let address = '';
    let balance = '0';

    try {
      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();
      address = await signer.getAddress();

      try {
        const balanceBN = await ethersProvider.getBalance(address);
        balance = ethers.formatEther(balanceBN);
      } catch (e) {
        console.warn('读取余额失败（忽略，不影响登录）:', e);
      }
    } catch (e: any) {
      console.error('获取账户信息失败:', e);
      const msg = String(e?.message ?? '');
      if (msg.includes('Response has no error or result for request')) {
        throw new Error(
          '浏览器钱包没有返回有效账户信息。请确认只启用了一个以太坊钱包扩展（推荐仅开启 MetaMask），并在钱包中连接当前站点后重试。'
        );
      }
      throw new Error(msg || '获取账户信息失败，请稍后重试');
    }

    // 4. 获取 Web3Auth 用户信息（Google 会有 email/name）
    let userInfo: any = {};
    try {
      userInfo = await web3auth.getUserInfo();
    } catch (e) {
      console.warn('获取 Web3Auth 用户信息失败（忽略）:', e);
    }

    const user: User = {
      address,
      balance,
      email: userInfo?.email ?? undefined,
      name: userInfo?.name ?? undefined,
      profileImage: userInfo?.profileImage ?? undefined
    };

    console.log('[Web3Auth] 登录成功:', user);
    return user;
  }

  // 这里暂时不做全局 logout，真的需要可再加
  async logout() {
    // 每次 login 都是新实例，这里可以暂时留空
  }
}

export const web3AuthService = new Web3AuthService();
