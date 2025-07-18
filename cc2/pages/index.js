import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BookOpenIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const mainNavLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: AcademicCapIcon,
      color: "from-blue-500 to-cyan-500",
      description: "Your personal hub",
    },
    {
      href: "/events",
      label: "Events",
      icon: CalendarDaysIcon,
      color: "from-purple-500 to-pink-500",
      description: "Discover campus events",
    },
    {
      href: "/resources",
      label: "Resources",
      icon: BookOpenIcon,
      color: "from-green-500 to-emerald-500",
      description: "Academic materials",
    },
    {
      href: "/jobs",
      label: "Jobs",
      icon: BriefcaseIcon,
      color: "from-orange-500 to-red-500",
      description: "Career opportunities",
    },
    {
      href: "/posts",
      label: "Posts",
      icon: ChatBubbleLeftRightIcon,
      color: "from-pink-500 to-rose-500",
      description: "Community discussions",
    },
    {
      href: "/connections",
      label: "Connections",
      icon: UserGroupIcon,
      color: "from-indigo-500 to-purple-500",
      description: "Network & connect",
    },
  ];

  const authLinks = [
    { href: "/login", label: "Sign In", primary: false },
    { href: "/signup", label: "Sign Up", primary: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <Head>
        <title>CampusConnect - Your Digital Campus Hub</title>
        <meta
          name="description"
          content="Connect with your campus community, discover events, find opportunities, and build lasting relationships."
        />
      </Head>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium mb-8"
            variants={itemVariants}
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Welcome to the future of campus life
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight"
            variants={itemVariants}
          >
            Campus
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Connect
            </span>
          </motion.h1>

          <motion.p
            className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Your digital hub for campus life. Connect with peers, discover
            events, find opportunities, and build lasting relationships in your
            academic community.
          </motion.p>
        </motion.div>

        {/* Main Navigation Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mb-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {mainNavLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.href}
                variants={cardVariants}
                whileHover="hover"
                className="group"
              >
                <Link href={link.href} className="block">
                  <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
                    {/* Gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    ></div>

                    <div className="relative z-10">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${link.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                        {link.label}
                      </h3>

                      <p className="text-white/70 text-sm mb-4 group-hover:text-white/90 transition-colors">
                        {link.description}
                      </p>

                      <div className="flex items-center text-white/60 group-hover:text-white transition-colors">
                        <span className="text-sm font-medium">Explore</span>
                        <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Authentication Section */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <span className="text-white/80 text-lg mr-4">
              Ready to get started?
            </span>
          </motion.div>
          {authLinks.map((link) => (
            <motion.div key={link.href} variants={itemVariants}>
              <Link
                href={link.href}
                className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
                  link.primary
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105"
                    : "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Admin Access */}
        <motion.div
          className="mt-12"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <Link
            href="/admin"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md text-red-300 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 text-sm font-medium"
          >
            <span>Admin Access</span>
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 text-center"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} CampusConnect. Empowering campus
            communities.
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
