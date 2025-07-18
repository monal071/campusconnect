import { atom } from 'recoil';

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export const globalLoadingState = atom<LoadingState>({
  key: 'globalLoadingState',
  default: {
    isLoading: false
  }
});

export const authState = atom({
  key: 'authState',
  default: {
    isAuthenticated: false,
    isGuest: false,
    user: null
  }
});

export const themeState = atom({
  key: 'themeState',
  default: 'dark'
});

export const toastState = atom({
  key: 'toastState',
  default: {
    open: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning'
  }
});

export const modalState = atom({
  key: 'modalState',
  default: {
    open: false,
    type: null as string | null,
    data: null as any
  }
});
