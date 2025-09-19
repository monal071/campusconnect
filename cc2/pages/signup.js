import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function Signup() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [role, setRole] = useState('student');
  const [adminPassword, setAdminPassword] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Initial check when component loads - check if email already registered
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        // First check if we have a session
        if (status === 'authenticated' && session?.user?.email) {
          const res = await fetch('/api/auth/check-registration', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            // Only redirect if they truly have a role assigned, not just because they've logged in with Google before
            if (data.isRegistered && data.role) {
              // User is already registered with a role
              setAlreadyRegistered(true);
              // Redirect after a short delay with a message
              setTimeout(() => {
                router.push('/login?message=You are already registered. Please sign in.');
              }, 1500);
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
      }
    };
    
    checkExistingUser();
  }, [status, session, router]);

  // Check authentication status and handle accordingly
  useEffect(() => {
    // Skip if we already know the user is registered
    if (alreadyRegistered) return;
    
    console.log("Auth status:", status, "Session:", !!session);
    
    // Only run the check if user is authenticated with Google
    if (status === 'authenticated' && session?.user) {
      console.log("User authenticated with Google:", session.user.email);
      
      // Check if the user already has a complete registration with a role
      const checkUserRegistration = async () => {
        try {
          console.log("Checking registration status...");
          const res = await fetch('/api/auth/check-registration', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log("Registration check response:", res.status);
          
          if (res.status === 401) {
            // User is not authenticated with the server, keep showing Google sign-in
            console.log("Session not recognized by server");
            return;
          }
          
          const data = await res.json();
          console.log("Registration data:", data);
          
          if (res.ok && data.isRegistered) {
            // User is already registered with a role, redirect based on role
            console.log("User is registered with role:", data.role);
            setAlreadyRegistered(true);
            if (data.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/home');
            }
          } else {
            // User authenticated but needs to select a role
            console.log("User needs to select a role");
            setShowRoleSelection(true);
          }
        } catch (error) {
          console.error('Error checking registration:', error);
          // Don't show role selection on error - might not be authenticated properly
        }
      };

      checkUserRegistration();
    }
  }, [status, session, router]);

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate admin password if role is admin
    if (role === 'admin' && adminPassword !== '12345678') {
      setError('Invalid admin password');
      setLoading(false);
      return;
    }
    
    // Validate faculty password if role is faculty
    if (role === 'faculty' && facultyPassword !== '12345678') {
      setError('Invalid faculty password');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          role,
          adminPassword,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store user data in localStorage
      localStorage.setItem('role', role);
      
      // Redirect based on role
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/home');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <div className="animate-spin h-12 w-12 border-t-2 border-blue-500 border-r-2 border-b-2 rounded-full"></div>
      </div>
    );
  }
  
  // If we're authenticated but showRoleSelection is still false, we're likely in a loading state
  // waiting for the API check to complete
  if (status === 'authenticated' && !showRoleSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-12 w-12 border-t-2 border-blue-500 border-r-2 border-b-2 rounded-full"></div>
          <p className="text-white text-lg">Checking your registration...</p>
        </div>
      </div>
    );
  }
  
  // Show already registered message
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Already Registered</h2>
            <p className="text-gray-600 dark:text-gray-300">You've already completed registration with this account.</p>
            <p className="text-gray-600 dark:text-gray-300">Redirecting you to the login page...</p>
            <Link href="/login" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      {/* Left side with gradient background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-blue-600/80 to-purple-700/80 p-12 flex-col justify-between relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-tr from-blue-500/40 via-purple-500/30 to-transparent blur-2xl z-0" 
        />
        
        <div className="relative z-10">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="flex items-center space-x-3"
          >
            <Image
              src="/link-cube-light.svg"
              alt="CampusConnect Logo"
              width={40}
              height={40}
            />
            <span className="text-white text-2xl font-semibold tracking-wide drop-shadow-lg">CampusConnect</span>
          </motion.div>
          
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-24"
          >
            <h1 className="text-white text-5xl font-extrabold mb-6 drop-shadow-xl">Join Our Community!</h1>
            <p className="text-white/90 text-xl max-w-md">
              Create an account to connect with others and share your journey.
            </p>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-white/80 z-10"
        >
          <p className="mb-4 text-lg">Already have an account?</p>
          <Link href="/login" className="inline-flex items-center px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200">
            <span className="mr-2">Sign in instead</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </motion.div>
      </div>

      {/* Right side with glassmorphic signup form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-black/60 backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 md:p-10 space-y-8 relative"
        >
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
              {showRoleSelection ? 'Select Your Role' : 'Create Account'}
            </h2>
            <div className="md:hidden flex justify-end">
              <Link href="/login" className="text-gray-300 hover:text-white text-sm transition-colors">Already have an account?</Link>
            </div>
          </div>

          {showRoleSelection ? (
            // Role selection form (shown after Google authentication)
            <form onSubmit={handleSubmitRole} className="mt-8 space-y-7">
              <div className="space-y-6">
                {/* Display user info */}
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <div className="flex justify-center mb-3">
                    {session?.user?.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={60}
                        height={60}
                        className="rounded-full border-2 border-white/30"
                      />
                    )}
                  </div>
                  <p className="text-white font-medium">{session?.user?.name}</p>
                  <p className="text-gray-300 text-sm">{session?.user?.email}</p>
                </div>
                
                {/* Role selection */}
                <div className="space-y-3">
                  <label className="block text-gray-300 text-sm">Select Role</label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        id="student-role"
                        name="role"
                        type="radio"
                        value="student"
                        checked={role === 'student'}
                        onChange={() => setRole('student')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="student-role" className="ml-2 block text-sm text-gray-300">
                        Student
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="faculty-role"
                        name="role"
                        type="radio"
                        value="faculty"
                        checked={role === 'faculty'}
                        onChange={() => setRole('faculty')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="faculty-role" className="ml-2 block text-sm text-gray-300">
                        Faculty
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="admin-role"
                        name="role"
                        type="radio"
                        value="admin"
                        checked={role === 'admin'}
                        onChange={() => setRole('admin')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="admin-role" className="ml-2 block text-sm text-gray-300">
                        Admin
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Admin password field (only shown if admin role is selected) */}
                {role === 'admin' && (
                  <div className="relative">
                    <input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="peer w-full px-4 pt-6 pb-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Admin Password"
                      autoComplete="new-password"
                      aria-label="Admin Password"
                    />
                    <label htmlFor="adminPassword" className="absolute left-4 top-2 text-gray-300 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
                      Admin Password
                    </label>
                    <p className="mt-1 text-xs text-gray-400">Enter the admin password (12345678)</p>
                  </div>
                )}
                
                {/* Faculty password field (only shown if faculty role is selected) */}
                {role === 'faculty' && (
                  <div className="relative">
                    <input
                      id="facultyPassword"
                      name="facultyPassword"
                      type="password"
                      required
                      value={facultyPassword}
                      onChange={(e) => setFacultyPassword(e.target.value)}
                      className="peer w-full px-4 pt-6 pb-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Faculty Password"
                      autoComplete="new-password"
                      aria-label="Faculty Password"
                    />
                    <label htmlFor="facultyPassword" className="absolute left-4 top-2 text-gray-300 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
                      Faculty Password
                    </label>
                    <p className="mt-1 text-xs text-gray-400">Enter the faculty password (12345678)</p>
                  </div>
                )}
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center mt-2" 
                  role="alert"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white rounded-lg px-4 py-3 font-semibold shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black active:scale-95 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Completing Registration...
                  </span>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          ) : (
            // Google sign-in button (initial view)
            <div className="mt-8 space-y-7">
              <p className="text-gray-300 text-center">Sign up using your Google account to get started</p>
              
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/signup' })}
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 rounded-lg px-4 py-3 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#4285F4"/>
                </svg>
                Sign up with Google
              </button>

              <div className="relative flex items-center justify-center">
                <div className="h-px w-full bg-gray-700"></div>
                <span className="relative px-4 text-sm text-gray-400 bg-transparent">Or</span>
                <div className="h-px w-full bg-gray-700"></div>
              </div>

              <div className="text-center">
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-all">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          )}
          
          <p className="text-xs text-center text-gray-400 mt-2">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
