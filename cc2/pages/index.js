import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedBackground from "../components/AnimatedBackground";
import { 
  AcademicCapIcon, 
  UsersIcon, 
  CalendarDaysIcon, 
  BriefcaseIcon,
  ChatBubbleBottomCenterTextIcon,
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  HeartIcon,
  LightBulbIcon
} from "@heroicons/react/24/outline";

export default function Home() {
  const features = [
    {
      icon: UsersIcon,
      title: "Connect & Network",
      description: "Build meaningful relationships with peers, mentors, and alumni in your field.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: CalendarDaysIcon,
      title: "Campus Events",
      description: "Discover and attend events, workshops, and activities happening on campus.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: BriefcaseIcon,
      title: "Career Opportunities",
      description: "Find internships, jobs, and career development resources tailored for students.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: BookOpenIcon,
      title: "Academic Resources",
      description: "Access study materials, tutoring services, and academic support resources.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: "Community Posts",
      description: "Share experiences, ask questions, and engage with your campus community.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: SparklesIcon,
      title: "Personal Growth",
      description: "Track your progress, set goals, and develop skills for your future career.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Students" },
    { number: "500+", label: "Campus Events" },
    { number: "1K+", label: "Job Opportunities" },
    { number: "50+", label: "Universities" }
  ];

  const benefits = [
    "Connect with like-minded peers",
    "Access exclusive campus events",
    "Find internships and job opportunities",
    "Get academic support and resources",
    "Build your professional network"
  ];

  return (
    <div className="min-h-screen w-full hero-gradient">
      <Head>
        <title>CampusConnect - Your Campus Community Hub</title>
        <meta name="description" content="Connect with your campus community. Discover events, resources, job opportunities, and build valuable connections." />
      </Head>
      
      {/* Background Effects */}
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white"
        >
          Campus<span className="text-cyan-400">Connect</span>
        </motion.div>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-white hover:text-cyan-300 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-tight">
              Your Campus
              <br />
              <span className="gradient-text">
                Community Hub
              </span>
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Connect with peers, discover opportunities, and thrive in your academic journey. 
            Join thousands of students building their future together.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <Link
              href="/signup"
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
            >
              Start Connecting
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('guest', 'true');
                  document.cookie = 'guest=true; path=/; max-age=86400'; // 1 day
                  window.location.href = '/dashboard';
                }
              }}
              className="px-8 py-4 border-2 border-white/20 text-white text-lg font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Explore as Guest
            </button>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Discover all the tools and resources designed to enhance your campus experience and accelerate your academic and professional growth.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group p-8 glass-effect rounded-2xl hover:bg-white/10 transition-all duration-300 feature-card hover-lift"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Why Choose
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> CampusConnect?</span>
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/20">
                  <GlobeAltIcon className="w-8 h-8 text-blue-400 mb-4" />
                  <h4 className="text-white font-semibold mb-2">Global Network</h4>
                  <p className="text-slate-400 text-sm">Connect with students worldwide</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20">
                  <HeartIcon className="w-8 h-8 text-purple-400 mb-4" />
                  <h4 className="text-white font-semibold mb-2">Community First</h4>
                  <p className="text-slate-400 text-sm">Built by students, for students</p>
                </div>
              </div>
              <div className="space-y-6 mt-8">
                <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/20">
                  <LightBulbIcon className="w-8 h-8 text-green-400 mb-4" />
                  <h4 className="text-white font-semibold mb-2">Smart Matching</h4>
                  <p className="text-slate-400 text-sm">AI-powered connections</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/20">
                  <AcademicCapIcon className="w-8 h-8 text-orange-400 mb-4" />
                  <h4 className="text-white font-semibold mb-2">Academic Excellence</h4>
                  <p className="text-slate-400 text-sm">Resources for success</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Explore CampusConnect</h2>
            <p className="text-lg text-slate-300">Get started with these popular features</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { href: "/dashboard", label: "Dashboard", icon: "📊" },
              { href: "/events", label: "Events", icon: "📅" },
              { href: "/resources", label: "Resources", icon: "📚" },
              { href: "/jobs", label: "Jobs", icon: "💼" },
              { href: "/posts", label: "Community", icon: "💬" },
              { href: "/connections", label: "Network", icon: "🤝" },
              { href: "/quiz", label: "Quizzes", icon: "🧠" },
              { href: "/login", label: "Sign In", icon: "👤" }
            ].map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      if (link.href !== '/login' && link.href !== '/signup') {
                        localStorage.setItem('guest', 'true');
                        document.cookie = 'guest=true; path=/; max-age=86400'; // 1 day
                      }
                      window.location.href = link.href;
                    }
                  }}
                  className="block w-full p-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 transition-all duration-300 text-center group"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{link.icon}</div>
                  <div className="text-white font-medium">{link.label}</div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="p-12 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl border border-white/20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                Connect with your campus community and discover new opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/signup"
                  className="group px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 animate-glow flex items-center justify-center gap-2"
                >
                  Sign Up Now
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('guest', 'true');
                      document.cookie = 'guest=true; path=/; max-age=86400'; // 1 day
                      window.location.href = '/dashboard';
                    }
                  }}
                  className="px-10 py-4 border-2 border-white/20 text-white text-lg font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  Explore as Guest
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 CampusConnect. Building stronger campus communities, one connection at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}