import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ConnectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the connections page
    router.replace('/connections');
  }, [router]);
  
  // Return a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="ml-3 text-gray-600 dark:text-gray-400">Redirecting...</p>
    </div>
  );
}