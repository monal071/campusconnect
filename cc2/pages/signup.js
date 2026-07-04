import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Role passwords
const ROLE_PASSWORDS = {
  admin: "12345678",
  faculty: "87654321",
};

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

  // Steps: 1 = Role Selection, 2 = Password (for admin/faculty), 3 = Registration Form
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolePassword, setRolePassword] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [institute, setInstitute] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [bio, setBio] = useState("");
  const [studentId, setStudentId] = useState("");

  // Check if user already completed registration
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // If profile is already complete, redirect based on role
      if (session.user.role && session.user.isProfileComplete) {
        if (session.user.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
        return;
      }

      // Pre-fill data from session
      setFullName(session.user.name || "");
    }
  }, [status, session, router]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");

    if (role === "student") {
      // Students go directly to registration form
      setStep(3);
    } else {
      // Admin and faculty need password
      setStep(2);
    }
  };

  const handlePasswordVerify = (e) => {
    e.preventDefault();
    setError("");

    const correctPassword = ROLE_PASSWORDS[selectedRole];
    if (rolePassword !== correctPassword) {
      setError("Invalid password. Please try again.");
      return;
    }

    // Password correct, proceed to registration
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    // Admin doesn't need institute/department
    if (selectedRole !== "admin") {
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
    }

    if (selectedRole === "student") {
      if (!semester) {
        setError("Please select your current semester");
        setLoading(false);
        return;
      }
      if (!studentId.trim()) {
        setError("Please enter your student ID");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          institute: selectedRole !== "admin" ? institute : null,
          department: selectedRole !== "admin" ? department : null,
          semester: selectedRole === "student" ? semester : null,
          studentId: selectedRole === "student" ? studentId.trim() : null,
          bio: bio.trim(),
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Refresh the session to pick up new role and profile data
      await update();

      toast.success("Registration completed successfully!");

      // Redirect based on role
      if (selectedRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
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

  // Authenticated - show registration steps
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
            {step === 1 && "Select Your Role"}
            {step === 2 && "Verify Your Role"}
            {step === 3 && "Complete Your Profile"}
          </h1>
          <p className="text-white/90 text-lg max-w-md mb-8">
            {step === 1 &&
              "Choose your role to continue with the registration process."}
            {step === 2 &&
              "Enter the password provided by your administrator to continue."}
            {step === 3 &&
              "Fill in your details so others can find and connect with you."}
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
                {selectedRole && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      selectedRole === "admin"
                        ? "bg-red-500/30 text-red-200"
                        : selectedRole === "faculty"
                          ? "bg-green-500/30 text-green-200"
                          : "bg-blue-500/30 text-blue-200"
                    }`}
                  >
                    {selectedRole.charAt(0).toUpperCase() +
                      selectedRole.slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s <= step ? "bg-white w-8" : "bg-white/30 w-4"
                } ${s === 2 && selectedRole === "student" ? "hidden" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-8 bg-black/60 backdrop-blur-xl overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 md:p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                  Select Your Role
                </h2>
                <p className="text-gray-400">
                  Choose how you&apos;ll use CampusConnect
                </p>
              </div>

              <div className="space-y-4">
                {/* Student */}
                <button
                  onClick={() => handleRoleSelect("student")}
                  className="w-full p-6 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        className="w-8 h-8 text-blue-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Student</h3>
                      <p className="text-blue-200/70 text-sm">
                        Join classes, take quizzes, connect with peers
                      </p>
                    </div>
                  </div>
                </button>

                {/* Faculty */}
                <button
                  onClick={() => handleRoleSelect("faculty")}
                  className="w-full p-6 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 hover:border-green-400/50 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        className="w-8 h-8 text-green-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Faculty</h3>
                      <p className="text-green-200/70 text-sm">
                        Create quizzes, manage communities, guide students
                      </p>
                    </div>
                  </div>
                </button>

                {/* Admin */}
                <button
                  onClick={() => handleRoleSelect("admin")}
                  className="w-full p-6 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 hover:border-red-400/50 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg
                        className="w-8 h-8 text-red-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Admin</h3>
                      <p className="text-red-200/70 text-sm">
                        Full system access, manage platform settings
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Password Verification (for admin/faculty) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 md:p-8 space-y-6"
            >
              <div className="text-center">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    selectedRole === "admin"
                      ? "bg-red-500/30"
                      : "bg-green-500/30"
                  }`}
                >
                  <svg
                    className={`w-8 h-8 ${selectedRole === "admin" ? "text-red-300" : "text-green-300"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                  {selectedRole === "admin" ? "Admin" : "Faculty"} Verification
                </h2>
                <p className="text-gray-400">
                  Enter the {selectedRole} password to continue
                </p>
              </div>

              <form onSubmit={handlePasswordVerify} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {selectedRole === "admin" ? "Admin" : "Faculty"} Password
                  </label>
                  <input
                    type="password"
                    value={rolePassword}
                    onChange={(e) => setRolePassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                  >
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedRole("");
                      setRolePassword("");
                      setError("");
                    }}
                    className="flex-1 px-4 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                      selectedRole === "admin"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Verify
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Registration Form */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 md:p-8 space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
                  Complete Registration
                </h2>
                <p className="text-gray-400 text-sm">
                  {selectedRole === "admin"
                    ? "Set up your admin account"
                    : "Fill in your profile details"}
                </p>
              </div>

              {/* Mobile role indicator */}
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
                      className={`text-xs ${
                        selectedRole === "admin"
                          ? "text-red-300"
                          : selectedRole === "faculty"
                            ? "text-green-300"
                            : "text-blue-300"
                      }`}
                    >
                      {selectedRole.charAt(0).toUpperCase() +
                        selectedRole.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5">
                    Full Name *
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

                {/* Student ID (students only) */}
                {selectedRole === "student" && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      Student ID *
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) =>
                        setStudentId(e.target.value.toUpperCase())
                      }
                      placeholder="e.g., 23DCE087"
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                )}

                {/* Institute (not for admin) */}
                {selectedRole !== "admin" && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      Institute *
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
                )}

                {/* Department (not for admin) */}
                {selectedRole !== "admin" && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      Department *
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
                          <option
                            key={dept}
                            value={dept}
                            className="bg-gray-900"
                          >
                            {dept}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Semester (students only) */}
                {selectedRole === "student" && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1.5">
                      Current Semester *
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

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRole === "student") {
                        setStep(1);
                        setSelectedRole("");
                      } else {
                        setStep(2);
                        setRolePassword("");
                      }
                      setError("");
                    }}
                    className="flex-1 px-4 py-3 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white rounded-lg px-4 py-3 font-semibold shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                        Registering...
                      </span>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
