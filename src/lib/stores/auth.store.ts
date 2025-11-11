// src/lib/stores/auth.store.ts
import { writable } from "svelte/store";
import {
  loginWithGoogleWeb3Auth,
  loginWithMetaMaskDirect,
  logoutWeb3Auth,
  type Web3AuthLoginResult,
} from "$lib/services/web3auth.service";

export type LoginMethod = "google" | "metamask" | null;

export type User = {
  address: string;
  email?: string | null;
  name?: string | null;
  loginMethod: LoginMethod;
};

type AuthState = {
  user: User | null;
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

    /** 登录：根据按钮选择 Google 或 MetaMask */
    async loginWithWeb3Auth(method: "Google" | "metamask"): Promise<User | null> {
      set({ user: null, isLoading: true, error: null });

      try {
        let user: User;

        if (method === "Google") {
          const res: Web3AuthLoginResult = await loginWithGoogleWeb3Auth();

          user = {
            address: res.address,
            email: (res.userInfo as any)?.email ?? null,
            name: (res.userInfo as any)?.name ?? null,
            loginMethod: "google",
          };

          // TODO: 在这里保存到 Supabase / 后端（带上 loginMethod）
          // await saveUserToDatabase(user, { type: "google_web3auth", ...res });
        } else {
          const res = await loginWithMetaMaskDirect();

          user = {
            address: res.address,
            loginMethod: "metamask",
          };

          // TODO: 在这里保存到 Supabase / 后端
          // await saveUserToDatabase(user, { type: "metamask", address: res.address });
        }

        set({ user, isLoading: false, error: null });
        return user;
      } catch (e: any) {
        console.error("登录失败：", e);
        const msg = e?.message ?? "未知错误";
        set({ user: null, isLoading: false, error: msg });
        return null;
      }
    },

    /** ✅ 登出：根据登录方式决定是否调用 Web3Auth logout */
    async logout() {
      let currentUser: User | null;
      update((s) => {
        currentUser = s.user;
        return { ...s, isLoading: true, error: null };
      });

      try {
        if (currentUser?.loginMethod === "google") {
          await logoutWeb3Auth();
        }
        // MetaMask 不需要真正 "登出"，我们只清理本地状态即可

        set({ user: null, isLoading: false, error: null });
      } catch (e: any) {
        console.error("登出失败：", e);
        const msg = e?.message ?? "未知错误";
        set({ user: null, isLoading: false, error: msg });
      }
    },
  };
}

export const authStore = createAuthStore();
