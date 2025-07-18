import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

const icons = {
  success: <CheckCircleIcon className="text-green-500" />,
  error: <CancelIcon className="text-red-500" />,
  info: <InfoIcon className="text-blue-500" />,
  warning: <WarningIcon className="text-yellow-500" />
};

export default function Toast({ message, type = 'info', onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-[#1D1D1D] border border-gray-800 rounded-lg shadow-lg px-4 py-3"
      >
        {icons[type]}
        <p className="text-white">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-white transition-colors"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
} 