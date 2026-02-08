import Head from "next/head";
import Link from "next/link";
import {
  UsersIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  BookOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const features = [
    {
      icon: UsersIcon,
      title: "Connect & Network",
      description:
        "Build relationships with peers, mentors, and alumni in your field.",
    },
    {
      icon: CalendarDaysIcon,
      title: "Campus Events",
      description:
        "Discover and join events, workshops, and activities on campus.",
    },
    {
      icon: BriefcaseIcon,
      title: "Job Opportunities",
      description:
        "Find internships, jobs, and career resources tailored for students.",
    },
    {
      icon: BookOpenIcon,
      title: "Academic Resources",
      description:
        "Access and share study materials, notes, and learning resources.",
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: "Communities",
      description:
        "Join communities, share experiences, and engage with your campus.",
    },
    {
      icon: AcademicCapIcon,
      title: "Quizzes",
      description:
        "Take quizzes created by faculty and track your academic progress.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Head>
        <title>CampusConnect - Your Campus Community Hub</title>
        <meta
          name="description"
          content="Connect with your campus community. Discover events, resources, job opportunities, and build valuable connections."
        />
      </Head>

      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4">
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Your Campus{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            Community Hub
          </span>
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Connect with peers, discover opportunities, and thrive in your
          academic journey. Everything your campus community needs in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="group px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            Get Started
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Everything you need
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Tools and resources designed to enhance your campus experience.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            Join your campus community and start connecting with peers,
            discovering events, and finding opportunities.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Your Account
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="px-6 text-center text-sm text-gray-500 dark:text-gray-400">
          CampusConnect
        </div>
      </footer>
    </div>
  );
}
