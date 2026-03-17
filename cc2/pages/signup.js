import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";

// CHARUSAT institutes and their departments
const INSTITUTES = {
  DEPSTAR: {
    name: "DEPSTAR - Department of Computer Science & Technology",
    departments: [
      "Computer Engineering (CE)",
      "Computer Science & Engineering (CSE)",
      "Information Technology (IT)",
      "Computer Science & Design (CSD)",
    ],
  },
  CSPIT: {
    name: "CSPIT - Chandubhai S. Patel Institute of Technology",
    departments: [
      "Civil Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Electronics & Communication Engineering",
      "Chemical Engineering",
    ],
  },
  RPCP: {
    name: "RPCP - Ramanbhai Patel College of Pharmacy",
    departments: ["Pharmacy", "Pharmaceutical Sciences"],
  },
  PDPIAS: {
    name: "PDPIAS - P.D. Patel Institute of Applied Sciences",
    departments: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Microbiology",
      "Biochemistry",
    ],
  },
  IIIM: {
    name: "IIIM - Indukaka Ipcowala Institute of Management",
    departments: ["MBA", "BBA"],
  },
  SICART: {
    name: "SICART - Sophisticated Instrumentation Centre for Applied Research & Testing",
    departments: ["Applied Sciences", "Research"],
  },
  ARIP: {
    name: "ARIP - Ashok & Rita Patel Institute of Physiotherapy",
    departments: ["Physiotherapy"],
  },
  ILSASS: {
    name: "ILSASS - Institute of Language Studies and Applied Social Sciences",
    departments: ["English", "Social Sciences"],
  },
};

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export default function Signup() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const checkDone = useRef(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [institute, setInstitute] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [bio, setBio] = useState("");
  const [detectedRole, setDetectedRole] = useState("student");
  const [showForm, setShowForm] = useState(false);

  // Check if user already completed registration
  useEffect(() => {
    if (status !== "authenticated" || !session?.user || checkDone.current)
      return;
    checkDone.current = true;

    // If profile is already complete, redirect
    if (session.user.role && session.user.isProfileComplete) {
      router.replace("/dashboard");
      return;
    }

    // Pre-fill data from session
    setFullName(session.user.name || "");

    // Detect role from email
    const email = session.user.email?.toLowerCase() || "";
    const localPart = email.split("@")[0];
    if (/^\d{2}[a-z]{2,4}\d{2,4}$/.test(localPart)) {
      setDetectedRole("student");
    } else {
      setDetectedRole("faculty");
    }

    setShowForm(true);
  }, [status, session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }
    if (!institute) {
      setError("Please select your institute");
      setLoading(false);
      return;
    }
    if (!department) {
      setError("Please select your department");
      setLoading(false);
      return;
    }
    if (detectedRole === "student" && !semester) {
      setError("Please select your current semester");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          institute,
          department,
          semester: detectedRole === "student" ? semester : null,
          bio: bio.trim(),
          role: detectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Refresh the session to pick up new role and profile data
      await update();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <div className="animate-spin h-12 w-12 border-t-2 border-blue-500 border-r-2 border-b-2 rounded-full"></div>
      </div>
    );
  }

  // Not authenticated - show Google sign-in
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-purple-900 to-black">
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
              <span className="text-white text-2xl font-semibold tracking-wide">
                CampusConnect
              </span>
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-24"
            >
              <h1 className="text-white text-5xl font-extrabold mb-6">
                Join CHARUSAT Community!
              </h1>
              <p className="text-white/90 text-xl max-w-md">
                Sign in with your Charusat Google account to get started.
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
            <Link
              href="/login"
              className="inline-flex items-center px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
            >
              <span className="mr-2">Sign in instead</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-black/60 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 md:p-10 space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                Get Started
              </h2>
              <p className="text-gray-300">
                Sign in with your @charusat.edu.in Google account
              </p>
            </div>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/signup" })}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 rounded-lg px-4 py-3 font-medium hover:bg-gray-100 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
              >
                <path
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  fill="#4285F4"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="text-xs text-center text-gray-400">
              Only @charusat.edu.in emails are allowed
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Waiting for form to appear
  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-12 w-12 border-t-2 border-blue-500 border-r-2 border-b-2 rounded-full"></div>
          <p className="text-white text-lg">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-blue-600/80 to-purple-700/80 p-12 flex-col justify-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-gradient-to-tr from-blue-500/40 via-purple-500/30 to-transparent blur-2xl z-0"
        />
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-extrabold mb-6">
            Complete Your Profile
          </h1>
          <p className="text-white/90 text-lg max-w-md mb-8">
            Fill in your details so your classmates and faculty can find and
            connect with you.
          </p>

          {/* User info card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-sm">
            <div className="flex items-center gap-4">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={56}
                  height={56}
                  className="rounded-full border-2 border-white/30"
                />
              )}
              <div>
                <p className="text-white font-semibold">
                  {session?.user?.name}
                </p>
                <p className="text-gray-300 text-sm">{session?.user?.email}</p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    detectedRole === "student"
                      ? "bg-blue-500/30 text-blue-200"
                      : "bg-green-500/30 text-green-200"
                  }`}
                >
                  {detectedRole === "student" ? "Student" : "Faculty / Staff"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-8 bg-black/60 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 md:p-8 space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
              Complete Registration
            </h2>
            <p className="text-gray-400 text-sm">All fields are required</p>
          </div>

          {/* Mobile user info */}
          <div className="md:hidden bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-white text-sm font-medium">
                  {session?.user?.email}
                </p>
                <span
                  className={`text-xs ${detectedRole === "student" ? "text-blue-300" : "text-green-300"}`}
                >
                  {detectedRole === "student" ? "Student" : "Faculty / Staff"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Institute */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Institute
              </label>
              <select
                value={institute}
                onChange={(e) => {
                  setInstitute(e.target.value);
                  setDepartment("");
                }}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="" className="bg-gray-900">
                  Select your institute
                </option>
                {Object.entries(INSTITUTES).map(([key, inst]) => (
                  <option key={key} value={key} className="bg-gray-900">
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={!institute}
              >
                <option value="" className="bg-gray-900">
                  {institute
                    ? "Select your department"
                    : "Select institute first"}
                </option>
                {institute &&
                  INSTITUTES[institute]?.departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-gray-900">
                      {dept}
                    </option>
                  ))}
              </select>
            </div>

            {/* Semester (students only) */}
            {detectedRole === "student" && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">
                  Current Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" className="bg-gray-900">
                    Select semester
                  </option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                Bio <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
              >
                <p className="text-red-400 text-sm text-center">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white rounded-lg px-4 py-3 font-semibold shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Completing Registration...
                </span>
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
