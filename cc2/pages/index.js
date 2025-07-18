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
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import HeroSection from "../components/HeroSection";

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

  const features = [
    {
      title: "Smart Networking",
      description:
        "Connect with like-minded peers based on interests, courses, and career goals.",
      icon: UserGroupIcon,
    },
    {
      title: "Event Discovery",
      description:
        "Never miss important campus events, workshops, and social gatherings.",
      icon: CalendarDaysIcon,
    },
    {
      title: "Resource Sharing",
      description:
        "Access and share study materials, notes, and academic resources.",
      icon: BookOpenIcon,
    },
    {
      title: "Career Opportunities",
      description:
        "Discover internships, job openings, and career development programs.",
      icon: BriefcaseIcon,
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
    <>
      <Head>
        <title>CampusConnect - Your Digital Campus Hub</title>
        <meta
          name="description"
          content="Connect with your campus community, discover events, find opportunities, and build lasting relationships."
        />
      </Head>

      {/* Hero Section with Image */}
      <HeroSection
        title="Welcome to CampusConnect"
        subtitle="Your digital hub for campus life"
        description="Connect with peers, discover events, find opportunities, and build lasting relationships in your academic community. Join thousands of students already using CampusConnect to enhance their university experience."
        ctaText="Get Started"
        ctaHref="/signup"
        secondaryCtaText="Learn More"
        secondaryCtaHref="#features"
        showImage={true}
      />

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              variants={itemVariants}
            >
              Why Choose CampusConnect?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Discover the features that make campus life easier, more
              connected, and more successful.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Navigation Cards Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              variants={itemVariants}
            >
              Explore Campus Life
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300"
              variants={itemVariants}
            >
              Everything you need to make the most of your university experience
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
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
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl">
                      {/* Gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                      ></div>

                      <div className="relative z-10">
                        <div
                          className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${link.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {link.label}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                          {link.description}
                        </p>

                        <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl font-bold text-white mb-4"
              variants={itemVariants}
            >
              Ready to Transform Your Campus Experience?
            </motion.h2>
            <motion.p
              className="text-xl text-white/90 mb-8"
              variants={itemVariants}
            >
              Join thousands of students who are already using CampusConnect to
              enhance their university life.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={itemVariants}
            >
              {authLinks.map((link) => (
                <motion.div key={link.href} variants={itemVariants}>
                  <Link
                    href={link.href}
                    className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 ${
                      link.primary
                        ? "bg-white text-blue-600 hover:bg-gray-100 hover:shadow-2xl hover:scale-105"
                        : "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md text-red-600 dark:text-red-400 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 text-sm font-medium"
          >
            <span>Admin Access</span>
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © {new Date().getFullYear()} CampusConnect. Empowering campus
            communities worldwide.
          </p>
        </div>
      </footer>
    </>
  );
}
