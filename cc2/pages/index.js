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
    <div className="min-h-screen w-full bg-indigo-900">
      <Head>
        <title>CampusConnect</title>
      </Head>
      
      <div className="absolute inset-0 bg-[url('/pattern-bg.svg')] bg-repeat opacity-5"></div>
      
      <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6">
          Campus<span className="text-blue-400">Connect</span>
        </h1>
        
        <p className="text-xl text-white text-center mb-14 max-w-2xl">
          Connect with your campus community. Discover events, resources, job opportunities, and build valuable connections.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-5xl">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-medium text-lg text-center transition-all duration-300 backdrop-blur-sm border-b-2 border-transparent hover:border-blue-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}