import { atom } from "recoil";

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Use timestamp to ensure unique keys during development hot reload
const isDev = process.env.NODE_ENV === "development";
const timestamp = isDev ? Date.now().toString() : "";

export const globalLoadingState = atom<LoadingState>({
  key: `globalLoadingState${timestamp}`,
  default: {
    isLoading: false,
  },
});

export const authState = atom({
  key: `authState${timestamp}`,
  default: {
    isAuthenticated: false,
    isGuest: false,
    user: null,
  },
});

export const themeState = atom({
  key: `themeState${timestamp}`,
  default: "dark",
});

export const toastState = atom({
  key: `toastState${timestamp}`,
  default: {
    open: false,
    message: "",
    type: "info" as "info" | "success" | "error" | "warning",
  },
});

export const modalState = atom({
  key: `modalState${timestamp}`,
  default: {
    open: false,
    type: null as string | null,
    data: null as any,
  },
});
