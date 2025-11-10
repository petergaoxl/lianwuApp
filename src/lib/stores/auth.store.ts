import { writable } from 'svelte/store';

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
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  });

  return {
    subscribe,
    setUser: (user: User | null) => update(state => ({ ...state, user })),
    setLoading: (isLoading: boolean) => update(state => ({ ...state, isLoading })),
    setInitialized: (isInitialized: boolean) => update(state => ({ ...state, isInitialized })),
    setError: (error: string | null) => update(state => ({ ...state, error })),
    clearError: () => update(state => ({ ...state, error: null })),
    reset: () => set({ user: null, isLoading: false, isInitialized: true, error: null }),
  };
};

export const authStore = createAuthStore();