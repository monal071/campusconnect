import { motion } from 'framer-motion';
import { useRecoilValue } from 'recoil';
import { globalLoadingState } from '../atoms/globalState';

export default function LoadingSpinner({ size = 'default', fullScreen = false }) {
  const loadingState = useRecoilValue(globalLoadingState);
  
  if (!loadingState.isLoading) return null;

  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1
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
        className={`${spinnerSize} rounded-full border-t-2 border-b-2 border-blue-500`}
        animate={{ rotate: 360 }}
        transition={spinTransition}
      />
      <motion.div
        className={`${spinnerSize} rounded-full border-r-2 border-l-2 border-purple-500 absolute`}
        animate={{ rotate: -360 }}
        transition={spinTransition}
      />
      {loadingState.message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute mt-20 text-blue-100 text-center max-w-xs"
        >
          {loadingState.message}
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