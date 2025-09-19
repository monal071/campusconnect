import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Check for message in URL query parameter
  useEffect(() => {
    if (router.query.message) {
      setMessage(router.query.message);
    }
  }, [router.query]);

  // Handle authentication state changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // User is authenticated, check if they need to complete registration
      const checkRegistrationAndRedirect = async () => {
        try {
          const res = await fetch('/api/auth/check-registration');
          if (res.ok) {
            const data = await res.json();
            if (data.isRegistered && data.role) {
              // User has a role, redirect based on role
              if (data.role === 'admin') {
                router.push('/admin');
              } else if (data.role === 'student' || data.role === 'faculty') {
                router.push('/home');
              } else {
                // Handle legacy 'user' role if it exists
                router.push('/home');
              }
            } else {
              // User needs to complete registration
              router.push('/signup');
            }
          } else {
            // Default redirect if check fails
            router.push('/home');
          }
        } catch (error) {
          console.error('Error checking registration:', error);
          router.push('/home');
        }
      };

      checkRegistrationAndRedirect();
    }
  }, [status, session, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn('google', { 
        callbackUrl: '/login' // Will be handled by the useEffect above
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <Head>
        <title>CampusConnect - Sign In</title>
      </Head>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side - Image and Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-indigo-600 text-white p-8 md:p-12 flex-1 flex flex-col justify-center items-center md:items-start"
        >
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <Image 
                src="/campusconnect-logo.svg" 
                alt="CampusConnect Logo" 
                width={60} 
                height={60}
                className="mr-4" 
              />
              <h1 className="text-3xl md:text-4xl font-bold">CampusConnect</h1>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Connect with your campus community</h2>
            
            <p className="text-lg mb-8 text-indigo-100">
              Join thousands of students to discover events, resources, job opportunities, and build valuable connections.
            </p>
            
            <div className="flex flex-col space-y-4 text-indigo-100">
              <div className="flex items-center">
                <div className="mr-3 text-indigo-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Discover campus events</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 text-indigo-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Find job opportunities</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 text-indigo-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Connect with peers and mentors</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Right side - Login Form */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-8 md:p-12 flex-1 flex flex-col justify-center items-center"
        >
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
                Sign in to your account to continue
              </p>
              
              {/* Display message if present */}
              {message && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-blue-700 dark:text-blue-300 text-sm text-center">
                    {message}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8 space-y-6">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn || status === 'loading'}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isSigningIn ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300 group-hover:text-indigo-400" viewBox="0 0 24 24">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                  )}
                </span>
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
              
              <div className="flex items-center">
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-grow"></div>
                <div className="px-4 text-sm text-gray-500 dark:text-gray-400">or</div>
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-grow"></div>
              </div>
              
              <div className="flex">
                <Link 
                  href="/signup"
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Create New Account
                </Link>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    By signing in, you agree to our 
                    <a href="#" className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Terms of Service
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-4 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Don't have an account yet?{" "}
                  <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}