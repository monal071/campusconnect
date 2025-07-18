import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-transparent p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-200">Sign in to CampusConnect</h1>
        <button
          onClick={() => signIn("google", { callbackUrl: "/home" })}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}