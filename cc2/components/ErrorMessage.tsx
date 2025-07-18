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
    className: `bg-white/10 backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center shadow-2xl border border-white/20 ${className}`
  };

  const buttonProps: HTMLMotionProps<"button"> = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    onClick: onRetry,
    className: "px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
  };

  return (
    <motion.div {...containerProps}>
      {showIcon && (
        <div className="bg-red-500/10 p-3 rounded-full mb-4">
          <ErrorOutline className="w-8 h-8 text-red-500" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
      <p className="text-blue-100 text-center mb-6">{message}</p>
      {onRetry && (
        <motion.button {...buttonProps}>
          <RefreshIcon /> Try Again
        </motion.button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;