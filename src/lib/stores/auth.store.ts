import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import {
  loginWithGoogleWeb3Auth,
  loginWithMetaMaskDirect,
  logoutWeb3Auth,
  type Web3AuthLoginResult,
} from '$lib/services/web3auth.service';
import {
  upsertUserFromWeb3Auth,
  upsertUserFromMetaMask,
  type AppUser,
  type LoginMethod,
} from '$lib/services/user.service';

type AuthState = {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
};

function createAuthStore() {
  // 1. 初始化时尝试从 localStorage 恢复
  let initialUser: AppUser | null = null;
  
  // ✅ 修复：仅在浏览器环境访问 localStorage，避免 SSR 报错
  if (browser && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('lianwu_user');
    if (stored) {
      try {
        initialUser = JSON.parse(stored);
      } catch (e) {
        console.error('解析本地用户数据失败', e);
        localStorage.removeItem('lianwu_user');
      }
    }
  }

  const { subscribe, set, update } = writable<AuthState>({
    user: initialUser,
    isLoading: false,
    error: null,
  });

  return {
    subscribe,

    clearError() {
      update((s) => ({ ...s, error: null }));
    },

    /** 统一登录入口：参数只是“用户点的是哪个按钮” */
    async loginWithWeb3Auth(method: 'Google' | 'metamask'): Promise<AppUser | null> {
      set({ user: null, isLoading: true, error: null });

      try {
        let user: AppUser;

        if (method === 'Google') {
          // 👉 双重保险：先尝试清理上一段 Web3Auth 会话
          try {
            await logoutWeb3Auth();
          } catch (e) {
            console.log('logoutWeb3Auth 忽略错误: ', e);
          }

          console.log('🟢 authStore: 准备调用 loginWithGoogleWeb3Auth');
          // 1. 调用 Web3Auth 登录（内部弹窗可能选 Google/Discord）
          const loginResult: Web3AuthLoginResult = await loginWithGoogleWeb3Auth();

          // 2. 根据 userInfo 推断具体是 google / discord，并写入 DB
          user = await upsertUserFromWeb3Auth(loginResult);
        } else {
          console.log('🟠 authStore: 准备调用 loginWithMetaMaskDirect');
          // MetaMask 直接连接
          const res = await loginWithMetaMaskDirect();
          user = await upsertUserFromMetaMask(res.address);
        }

        // 登陆完成的统一日志，方便你对比地址 & 登录方式
        console.log(
          '✅ 登录完成: method =',
          user.loginMethod,
          'address =',
          user.address
        );

        // ✅ 保存到 localStorage
        if (browser && typeof localStorage !== 'undefined') {
          localStorage.setItem('lianwu_user', JSON.stringify(user));
        }

        set({ user, isLoading: false, error: null });
        return user;
      } catch (e: any) {
        console.error('❌ 登录或写入数据库失败:', e);
        const msg = e?.message ?? e?.error_description ?? '未知错误';
        set({ user: null, isLoading: false, error: msg });
        return null;
      }
    },

    /** 登出：如果是 Web3Auth（google/discord），调用 Web3Auth logout；MetaMask 只清本地状态 */
    async logout() {
      const currentUser = get({ subscribe }).user;

      update((s) => ({ ...s, isLoading: true, error: null }));

      try {
        if (currentUser && (currentUser.loginMethod === 'google' || currentUser.loginMethod === 'discord')) {
          await logoutWeb3Auth();
        }

        // ✅ 清理 localStorage
        if (browser && typeof localStorage !== 'undefined') {
          localStorage.removeItem('lianwu_user');
        }

        set({ user: null, isLoading: false, error: null });
      } catch (e: any) {
        console.error('❌ 登出失败:', e);
        const msg = e?.message ?? '未知错误';
        set({ user: null, isLoading: false, error: msg });
      }
    },
  };
}

export const authStore = createAuthStore();
export type User = AppUser;
export type { LoginMethod } from '$lib/services/user.service';
