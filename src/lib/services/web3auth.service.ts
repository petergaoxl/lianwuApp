// src/lib/services/web3auth.service.ts
import { Web3Auth } from '@web3auth/modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { WALLET_ADAPTERS } from '@web3auth/base';
import { ethers } from 'ethers';
import { getWeb3AuthConfig, TAIKO_HOOLIGAN_CONFIG } from '$lib/config/web3auth';
import type { User } from '$lib/stores/auth.store';

class Web3AuthService {
  private web3auth: Web3Auth | null = null;
  private provider: any = null;

  private isBrowser() {
    return typeof window !== 'undefined';
  }

  private async initWeb3Auth() {
    if (this.web3auth) return this.web3auth;
    if (!this.isBrowser()) throw new Error('仅支持浏览器环境');

    const cfg = getWeb3AuthConfig();
    const privateKeyProvider = new EthereumPrivateKeyProvider({
      config: { chainConfig: cfg.chainConfig }
    });

    this.web3auth = new Web3Auth({
      clientId: cfg.clientId,
      web3AuthNetwork: cfg.web3AuthNetwork as any,
      privateKeyProvider,
      chainConfig: cfg.chainConfig
    });

    await this.web3auth.initModal({
      modalConfig: {
        [WALLET_ADAPTERS.OPENLOGIN]: {
          label: 'openlogin',
          loginMethods: { google: { name: 'google', showOnModal: true } }
        },
        [WALLET_ADAPTERS.METAMASK]: {
          label: 'metamask',
          showOnModal: true
        }
      }
    });

    return this.web3auth;
  }

  private async switchToTaikoNetwork() {
    if (!this.isBrowser() || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TAIKO_HOOLIGAN_CONFIG.chainIdHex }]
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: TAIKO_HOOLIGAN_CONFIG.chainIdHex,
            chainName: TAIKO_HOOLIGAN_CONFIG.name,
            nativeCurrency: TAIKO_HOOLIGAN_CONFIG.nativeCurrency,
            rpcUrls: TAIKO_HOOLIGAN_CONFIG.rpcUrls,
            blockExplorerUrls: TAIKO_HOOLIGAN_CONFIG.blockExplorerUrls
          }]
        });
      }
    }
  }

  async loginWithGoogle(): Promise<User> {
    const web3auth = await this.initWeb3Auth();
    this.provider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: 'google'
    });
    if (!this.provider) throw new Error('Google 登录失败');
    return await this.getUserInfo();
  }

  async loginWithMetaMask(): Promise<User> {
    if (!this.isBrowser() || !window.ethereum) {
      throw new Error('请先安装 MetaMask 钱包');
    }

    await this.switchToTaikoNetwork();
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('未获取到账户');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    let balance = '0';
    try {
      const balanceBN = await provider.getBalance(address);
      balance = ethers.formatEther(balanceBN);
    } catch (e) {
      console.warn('获取余额失败:', e);
    }

    return { address, balance, loginMethod: 'metamask' };
  }

  async connect(method: 'google' | 'metamask'): Promise<User> {
    if (method === 'google') {
      return await this.loginWithGoogle();
    } else {
      return await this.loginWithMetaMask();
    }
  }

  private async getUserInfo(): Promise<User> {
    if (!this.provider) throw new Error('未连接 provider');

    const ethersProvider = new ethers.BrowserProvider(this.provider);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();

    let balance = '0';
    try {
      const balanceBN = await ethersProvider.getBalance(address);
      balance = ethers.formatEther(balanceBN);
    } catch (e) {
      console.warn('获取余额失败:', e);
    }

    let userInfo: any = {};
    if (this.web3auth) {
      try {
        userInfo = await this.web3auth.getUserInfo();
      } catch (e) {
        console.warn('获取用户信息失败:', e);
      }
    }

    return {
      address,
      balance,
      email: userInfo?.email,
      name: userInfo?.name,
      profileImage: userInfo?.profileImage,
      loginMethod: userInfo?.email ? 'google' : 'web3auth'
    };
  }

  async logout() {
    try {
      if (this.web3auth && this.web3auth.connected) {
        await this.web3auth.logout();
      }
      this.provider = null;
    } catch (error) {
      console.error('登出失败:', error);
    }
  }
}

export const web3AuthService = new Web3AuthService();