import { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { globalLoadingState, toastState } from '../atoms/globalState';
import { ApiResponse } from '../types/api';

interface UseApiOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  showLoading?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
}

export function useApi<T = any>(defaultOptions: UseApiOptions = {}) {
  const setLoading = useSetRecoilState(globalLoadingState);
  const setToast = useSetRecoilState(toastState);
  const [error, setError] = useState<Error | null>(null);

  const callApi = async <R = T>(
    promise: Promise<ApiResponse<R>>,
    options: UseApiOptions = {}
  ): Promise<R | null> => {
    const opts = { ...defaultOptions, ...options };
    setError(null);

    try {
      if (opts.showLoading !== false) {
        setLoading({
          isLoading: true,
          message: opts.loadingMessage
        });
      }

      const response = await promise;

      if (!response.success) {
        throw new Error(response.error || 'An error occurred');
      }

      if (opts.showSuccess !== false && opts.successMessage) {
        setToast({
          open: true,
          type: 'success',
          message: opts.successMessage
        });
      }

      return response.data || null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(error);

      if (opts.showError !== false) {
        setToast({
          open: true,
          type: 'error',
          message: opts.errorMessage || error.message
        });
      }

      return null;
    } finally {
      if (opts.showLoading !== false) {
        setLoading({ isLoading: false });
      }
    }
  };

  return {
    callApi,
    error,
    isError: !!error,
    clearError: () => setError(null)
  };
}

// Example usage:
// const { callApi, error } = useApi({
//   loadingMessage: 'Loading posts...',
//   errorMessage: 'Failed to load posts'
// });
//
// const loadPosts = async () => {
//   const posts = await callApi(
//     fetch('/api/posts').then(r => r.json()),
//     { successMessage: 'Posts loaded successfully' }
//   );
//   if (posts) {
//     // Handle success
//   }
// };
