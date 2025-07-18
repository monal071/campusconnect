import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          action: 'register',
        }),
      });
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server error: ${text.substring(0, 100)}`);
      }
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('name', name);
      router.push('/home');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      {/* Left side with gradient background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-blue-600/80 to-purple-700/80 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/40 via-purple-500/30 to-transparent blur-2xl opacity-60 z-0" />
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <Image
              src="/link-cube-light.svg"
              alt="CampusConnect Logo"
              width={40}
              height={40}
            />
            <span className="text-white text-2xl font-semibold tracking-wide drop-shadow-lg">CampusConnect</span>
          </div>
          <div className="mt-24">
            <h1 className="text-white text-5xl font-extrabold mb-6 drop-shadow-xl">Join Our Community!</h1>
            <p className="text-white/90 text-xl max-w-md">
              Create an account to connect with others and share your journey.
            </p>
          </div>
        </div>
      </div>

      {/* Right side with glassmorphic signup form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-black/60 backdrop-blur-xl">
        <div className="w-full max-w-md mx-auto rounded-2xl shadow-2xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 md:p-10 space-y-8 relative">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">Create Account</h2>
            <div className="flex justify-end">
              <Link href="/login" className="text-gray-300 hover:text-white text-sm transition-colors">Already have an account?</Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <div className="space-y-6">
              {/* Floating label input for Name */}
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Full Name"
                  autoComplete="name"
                  aria-label="Full Name"
                />
                <label htmlFor="name" className="absolute left-4 top-2 text-gray-300 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
                  Full Name
                </label>
              </div>
              {/* Floating label input for Email */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Email"
                  autoComplete="email"
                  aria-label="Email"
                />
                <label htmlFor="email" className="absolute left-4 top-2 text-gray-300 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
                  Email
                </label>
              </div>
              {/* Floating label input for Password */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Password"
                  autoComplete="new-password"
                  aria-label="Password"
                />
                <label htmlFor="password" className="absolute left-4 top-2 text-gray-300 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm pointer-events-none">
                  Password
                </label>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center animate-shake mt-2" role="alert">{error}</p>
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-xs text-center text-gray-400 mt-2">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
