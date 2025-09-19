import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

const icons = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  error: <CancelIcon className="w-5 h-5 text-red-500" />,
  info: <InfoIcon className="w-5 h-5 text-blue-500" />,
  warning: <WarningIcon className="w-5 h-5 text-yellow-500" />
};

const bgColors = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
};

const textColors = {
  success: 'text-green-800 dark:text-green-200',
  error: 'text-red-800 dark:text-red-200',
  info: 'text-blue-800 dark:text-blue-200',
  warning: 'text-yellow-800 dark:text-yellow-200'
};

export default function Toast({ message, type = 'info', onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${bgColors[type]} border rounded-lg shadow-lg backdrop-blur-sm px-4 py-3 max-w-sm`}
      >
        {icons[type]}
        <p className={`${textColors[type]} text-sm font-medium flex-1`}>{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-2"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
} 