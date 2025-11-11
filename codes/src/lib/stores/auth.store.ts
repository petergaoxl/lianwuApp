// src/lib/stores/auth.store.ts
import { writable } from 'svelte/store';
import { web3AuthService } from '$lib/services/web3auth.service';
import { supabase } from '$lib/services/supabase.service';

export interface User {
  email?: string;
  name?: string;
  profileImage?: string;
  address: string;
  balance: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const createAuthStore = () => {
  const { subscribe, update, set } = writable<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: true,
    error: null
  });

  return {
    subscribe,

    // ✅ 核心登录函数：支持 Google 与 MetaMask
    loginWithWeb3Auth: async (method: 'google' | 'metamask'): Promise<User | null> => {
  if (typeof window === 'undefined') return null;

  update((s) => ({ ...s, isLoading: true, error: null }));

  try {
    const user = await web3AuthService.connect(method);

    if (user) {
      update((s) => ({
        ...s,
        user,
        isInitialized: true,
        isLoading: false,
        error: null
      }));
      return user;
    }
  } catch (err: any) {
    console.error('Web3Auth 登录失败:', err);
    update((s) => ({
      ...s,
      isLoading: false,
      error: err?.message ?? '登录失败，请稍后重试'
    }));
  } finally {
    update((s) => ({ ...s, isLoading: false }));
  }

  return null;
},



    // ✅ 登出函数
    logout: async () => {
      await web3AuthService.logout();
      set({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: null
      });
    },

    // ✅ 错误处理工具函数
    clearError: () => update((s) => ({ ...s, error: null })),
    setError: (msg: string) => update((s) => ({ ...s, error: msg }))
  };
};

export const authStore = createAuthStore();
