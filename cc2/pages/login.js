import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

export default function Login() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const redirecting = useRef(false);

  useEffect(() => {
    if (router.query.message) {
      setMessage(router.query.message);
    }
  }, [router.query]);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !redirecting.current) {
      redirecting.current = true;
      if (!session.user.role) {
        router.replace("/signup");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, session, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsSigningIn(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && session?.user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In - CampusConnect</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Sign in to your account
            </p>

            {message && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300 text-sm text-center">
                  {message}
                </p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isSigningIn || status === "loading"}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    fill="#4285F4"
                  />
                </svg>
              )}
              {isSigningIn ? "Signing in..." : "Sign in with Google"}
            </button>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
