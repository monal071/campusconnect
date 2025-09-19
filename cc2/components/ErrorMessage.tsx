import { motion, HTMLMotionProps } from 'framer-motion';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

const ErrorMessage = ({ 
  message, 
  onRetry, 
  className = '',
  showIcon = true
}: ErrorMessageProps) => {
  const containerProps: HTMLMotionProps<"div"> = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    className: `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex flex-col items-center shadow-sm ${className}`
  };

  const buttonProps: HTMLMotionProps<"button"> = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    onClick: onRetry,
    className: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
  };

  return (
    <motion.div {...containerProps}>
      {showIcon && (
        <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded-full mb-4">
          <ErrorOutline className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Something went wrong</h3>
      <p className="text-red-700 dark:text-red-300 text-center mb-4 text-sm">{message}</p>
      {onRetry && (
        <motion.button {...buttonProps}>
          <RefreshIcon className="w-4 h-4" /> Try Again
        </motion.button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;