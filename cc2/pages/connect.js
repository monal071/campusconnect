import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import PeopleIcon from '@mui/icons-material/People';

export default function ConnectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the connections page after a brief delay
    const timer = setTimeout(() => {
      router.replace('/connections');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center"
        >
          <PeopleIcon className="text-white text-2xl" />
        </motion.div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connecting You to Your Campus Community
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Redirecting to connections page...
        </p>
        
        <div className="flex items-center justify-center space-x-1">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-indigo-500 rounded-full"
          />
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-indigo-500 rounded-full"
          />
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-indigo-500 rounded-full"
          />
        </div>
        
        <button
          onClick={() => router.push('/connections')}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Connections Now
        </button>
      </motion.div>
    </div>
  );
}