import { motion } from 'framer-motion';
import { useRecoilValue } from 'recoil';
import { globalLoadingState } from '../atoms/globalState';

export default function LoadingSpinner({ size = 'default', fullScreen = false, message = null }) {
  const loadingState = useRecoilValue(globalLoadingState);

  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 0.8
  };

  const sizes = {
    small: 'w-6 h-6',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const spinnerSize = sizes[size] || sizes.default;

  const Spinner = () => (
    <div className="relative flex items-center justify-center">
      <motion.div
        className={`${spinnerSize} rounded-full border-3 border-transparent border-t-indigo-500 border-r-purple-500`}
        animate={{ rotate: 360 }}
        transition={spinTransition}
      />
      <motion.div
        className={`${spinnerSize} rounded-full border-2 border-transparent border-b-blue-400 border-l-pink-400 absolute`}
        animate={{ rotate: -360 }}
        transition={{ ...spinTransition, duration: 1.2 }}
      />
      {/* Center dot */}
      <div className="absolute w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
      
      {(loadingState.message || message) && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute mt-20 text-slate-600 dark:text-slate-300 text-center max-w-xs text-sm font-medium"
        >
          {message || loadingState.message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
      >
        <Spinner />
      </motion.div>
    );
  }

  return <Spinner />;
}