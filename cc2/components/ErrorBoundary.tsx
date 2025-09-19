import React from 'react';
import { motion } from 'framer-motion';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <motion.div
          {...fadeIn}
          className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4"
        >
          <div className="max-w-md w-full text-center">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <ErrorOutlineIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                We encountered an unexpected error. Don't worry, this has been reported and we're working on fixing it.
              </p>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleRefresh}
                  className="w-full btn btn-primary"
                >
                  <RefreshIcon className="w-4 h-4" />
                  Try Again
                </motion.button>
                
                <Link href="/home" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full btn btn-secondary"
                  >
                    <HomeIcon className="w-4 h-4" />
                    Go Home
                  </motion.button>
                </Link>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto text-slate-700 dark:text-slate-300">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}