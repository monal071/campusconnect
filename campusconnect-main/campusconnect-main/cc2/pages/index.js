import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/events", label: "Events" },
    { href: "/resources", label: "Resources" },
    { href: "/jobs", label: "Jobs" },
    { href: "/posts", label: "Posts" },
    { href: "/profile", label: "Profile" },
    { href: "/login", label: "Sign In" },
    { href: "/signup", label: "Sign Up" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900">
      <Head>
        <title>CampusConnect</title>
      </Head>
      <div className="flex flex-col items-center gap-8 p-8 bg-white/80 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-extrabold text-indigo-900 mb-2">CampusConnect</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform text-center"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform text-center"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}