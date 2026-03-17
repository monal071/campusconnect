import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const redirecting = useRef(false);

  // Show error from query params (e.g., blocked domain)
  useEffect(() => {
    if (router.query.error === "AccessDenied") {
      setErrorMsg(
        "Only Charusat university emails (@charusat.edu.in) are allowed.",
      );
    } else if (router.query.message) {
      setErrorMsg(router.query.message);
    }
  }, [router.query]);

  // Redirect authenticated users
  useEffect(() => {
    if (status === "authenticated" && session?.user && !redirecting.current) {
      redirecting.current = true;
      if (!session.user.role || !session.user.isProfileComplete) {
        router.replace("/signup");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, session, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setErrorMsg("Sign in failed. Please try again.");
      setIsSigningIn(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && session?.user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>CampusConnect - Sign In</title>
      </Head>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side - Branding */}
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

            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Charusat University Portal
            </h2>

            <p className="text-lg mb-8 text-indigo-100">
              Connect with fellow students and faculty at CHARUSAT. Discover
              events, share resources, find opportunities, and build your campus
              network.
            </p>

            <div className="flex flex-col space-y-4 text-indigo-100">
              <div className="flex items-center">
                <div className="mr-3 text-indigo-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Discover campus events &amp; workshops</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 text-indigo-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Share study resources &amp; notes</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 text-indigo-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>Connect with peers &amp; faculty</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-500/30 rounded-lg border border-indigo-400/30">
              <p className="text-sm text-indigo-200">
                Sign in with your Charusat email
              </p>
              <p className="text-xs text-indigo-300 mt-1">
                e.g., 23dce087@charusat.edu.in
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right side - Login */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-8 md:p-12 flex-1 flex flex-col justify-center items-center"
        >
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                Welcome
              </h2>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
                Sign in with your Charusat Google account
              </p>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm text-center">
                  {errorMsg}
                </p>
              </div>
            )}

            <div className="mt-8 space-y-6">
              <button
                onClick={handleSignIn}
                disabled={isSigningIn || status === "loading"}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isSigningIn ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#fff"
                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                      />
                    </svg>
                  )}
                </span>
                {isSigningIn ? "Signing in..." : "Sign in with Google"}
              </button>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Only @charusat.edu.in email addresses are allowed.
                <br />
                Students, faculty, and staff can sign in.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
