import Image from 'next/image';
import type { NextPage } from 'next';

const SignIn: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Welcome to CampusConnect
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Sign in to connect with others
          </p>
        </div>

        <div>
          <p className="text-center text-gray-700 dark:text-white">
            Please{' '}
            <a
              href="/login"
              className="text-blue-500 underline"
            >
              login
            </a>{' '}
            or{' '}
            <a
              href="/signup"
              className="text-blue-500 underline"
            >
              register
            </a>{' '}
            to continue.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;