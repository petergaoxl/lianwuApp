// src/lib/stores/auth.store.ts
import { writable } from 'svelte/store';
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
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
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
          // 1. 调用 Web3Auth 登录（内部弹窗可能选 Google/Discord）
          const loginResult: Web3AuthLoginResult = await loginWithGoogleWeb3Auth();

          // 2. 根据 userInfo 推断具体是 google / discord，并写入 DB
          user = await upsertUserFromWeb3Auth(loginResult);
        } else {
          // MetaMask 直接连接
          const res = await loginWithMetaMaskDirect();
          user = await upsertUserFromMetaMask(res.address);
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
      let currentUser: AppUser | null;
      update((s) => {
        currentUser = s.user;
        return { ...s, isLoading: true, error: null };
      });

      try {
        if (currentUser?.loginMethod === 'google' || currentUser?.loginMethod === 'discord') {
          await logoutWeb3Auth();
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
export type User = AppUser;           // 方便你在别处 import type User
export type { LoginMethod } from '$lib/services/user.service';
