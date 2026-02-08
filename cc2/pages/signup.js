import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";

export default function Signup() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [role, setRole] = useState("student");
  const [adminPassword, setAdminPassword] = useState("");
  const [facultyPassword, setFacultyPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    if (alreadyRegistered) return;

    const checkRegistration = async () => {
      try {
        const res = await fetch("/api/auth/check-registration");
        if (res.status === 401) return;

        const data = await res.json();
        if (res.ok && data.isRegistered && data.role) {
          setAlreadyRegistered(true);
          router.push(data.role === "admin" ? "/admin" : "/dashboard");
        } else {
          setShowRoleSelection(true);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      }
    };

    checkRegistration();
  }, [status, session, router, alreadyRegistered]);

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (role === "admin" && adminPassword !== "12345678") {
      setError("Invalid admin password");
      setLoading(false);
      return;
    }

    if (role === "faculty" && facultyPassword !== "12345678") {
      setError("Invalid faculty password");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          role,
          adminPassword,
          facultyPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      await signIn("google", {
        callbackUrl: role === "admin" ? "/admin" : "/dashboard",
        redirect: true,
      });
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (
    status === "loading" ||
    (status === "authenticated" && !showRoleSelection && !alreadyRegistered)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          {status === "authenticated" && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Checking registration...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Already Registered
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            You've already completed registration. Redirecting...
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up - CampusConnect</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Campus
              <span className="text-indigo-600 dark:text-indigo-400">
                Connect
              </span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-1">
              {showRoleSelection ? "Select Your Role" : "Create Account"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              {showRoleSelection
                ? "Choose how you'll use CampusConnect"
                : "Sign up with your Google account"}
            </p>

            {showRoleSelection ? (
              <form onSubmit={handleSubmitRole} className="space-y-5">
                {/* User info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                {/* Role selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["student", "faculty", "admin"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          role === r
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin password */}
                {role === "admin" && (
                  <div>
                    <label
                      htmlFor="adminPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Admin Password
                    </label>
                    <input
                      id="adminPassword"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter admin password"
                    />
                  </div>
                )}

                {/* Faculty password */}
                {role === "faculty" && (
                  <div>
                    <label
                      htmlFor="facultyPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Faculty Password
                    </label>
                    <input
                      id="facultyPassword"
                      type="password"
                      required
                      value={facultyPassword}
                      onChange={(e) => setFacultyPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter faculty password"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Completing..." : "Complete Registration"}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/signup" })}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                      fill="#4285F4"
                    />
                  </svg>
                  Sign up with Google
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
