import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Material UI Icons
import EventIcon from '@mui/icons-material/Event';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import EditIcon from '@mui/icons-material/Edit';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    connections: 0,
    posts: 0,
    events: 0,
    resources: 0,
    jobs: 0,
    profileViews: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [trendingResources, setTrendingResources] = useState([]);
  const [latestNews, setLatestNews] = useState([]);

  // Check if user is authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user stats
      const statsRes = await fetch('/api/dashboard/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData.data || {
          connections: Math.floor(Math.random() * 50) + 10,
          posts: Math.floor(Math.random() * 20) + 5,
          events: Math.floor(Math.random() * 8) + 2,
          resources: Math.floor(Math.random() * 15) + 5,
          jobs: Math.floor(Math.random() * 5) + 1,
          profileViews: Math.floor(Math.random() * 100) + 20
        });
      }

      // Fetch recent activity
      const activityRes = await fetch('/api/dashboard/activity');
      const activityData = await activityRes.json();
      if (activityRes.ok) {
        setRecentActivity(activityData.data || generateDummyActivity());
      } else {
        setRecentActivity(generateDummyActivity());
      }

      // Fetch upcoming events
      const eventsRes = await fetch('/api/events?limit=3');
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        setUpcomingEvents(eventsData.data || generateDummyEvents());
      } else {
        setUpcomingEvents(generateDummyEvents());
      }

      // Fetch recent jobs
      const jobsRes = await fetch('/api/jobs?limit=3');
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) {
        setRecentJobs(jobsData || generateDummyJobs());
      } else {
        setRecentJobs(generateDummyJobs());
      }

      // Fetch trending resources
      const resourcesRes = await fetch('/api/resources?limit=3&sort=popular');
      const resourcesData = await resourcesRes.json();
      if (resourcesRes.ok) {
        setTrendingResources(resourcesData.data || generateDummyResources());
      } else {
        setTrendingResources(generateDummyResources());
      }

      // Fetch latest news
      const newsRes = await fetch('/api/news?limit=3');
      const newsData = await newsRes.json();
      if (newsRes.ok) {
        setLatestNews(newsData || generateDummyNews());
      } else {
        setLatestNews(generateDummyNews());
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set dummy data if API calls fail
      setStats({
        connections: Math.floor(Math.random() * 50) + 10,
        posts: Math.floor(Math.random() * 20) + 5,
        events: Math.floor(Math.random() * 8) + 2,
        resources: Math.floor(Math.random() * 15) + 5,
        jobs: Math.floor(Math.random() * 5) + 1,
        profileViews: Math.floor(Math.random() * 100) + 20
      });
      setRecentActivity(generateDummyActivity());
      setUpcomingEvents(generateDummyEvents());
      setRecentJobs(generateDummyJobs());
      setTrendingResources(generateDummyResources());
      setLatestNews(generateDummyNews());
    } finally {
      setLoading(false);
    }
  };

  // Generate dummy data for development
  const generateDummyActivity = () => [
    {
      id: '1',
      type: 'connection',
      content: 'Sarah Johnson accepted your connection request',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      icon: 'PeopleIcon'
    },
    {
      id: '2',
      type: 'post',
      content: 'Your post about CS internships received 12 likes',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      icon: 'ArticleIcon'
    },
    {
      id: '3',
      type: 'event',
      content: 'You were tagged in the Tech Career Fair event',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      icon: 'EventIcon'
    },
    {
      id: '4',
      type: 'resource',
      content: 'Your shared resource on Web Development was saved by 5 users',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      icon: 'MenuBookIcon'
    },
    {
      id: '5',
      type: 'job',
      content: 'A new job matching your interests was posted: Software Developer Intern',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      icon: 'WorkIcon'
    }
  ];

  const generateDummyEvents = () => [
    {
      _id: '1',
      title: 'Tech Career Fair 2025',
      description: 'Connect with top tech companies hiring for internships and full-time positions',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      location: 'University Center, Main Hall'
    },
    {
      _id: '2',
      title: 'AI Workshop Series',
      description: 'Learn about the latest developments in artificial intelligence and machine learning',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
      location: 'Computer Science Building, Room 305'
    },
    {
      _id: '3',
      title: 'Hackathon 2025',
      description: '48-hour coding challenge with prizes and networking opportunities',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      location: 'Innovation Center'
    }
  ];

  const generateDummyJobs = () => [
    {
      _id: '1',
      title: 'Software Developer Intern',
      company: 'TechCorp',
      location: 'Remote',
      type: 'Internship',
      posted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      _id: '2',
      title: 'Data Scientist',
      company: 'AnalyticsPro',
      location: 'Boston, MA',
      type: 'Full-time',
      posted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
    },
    {
      _id: '3',
      title: 'UX/UI Designer',
      company: 'DesignWorks',
      location: 'San Francisco, CA',
      type: 'Part-time',
      posted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    }
  ];

  const generateDummyResources = () => [
    {
      _id: '1',
      title: 'Complete Web Development Roadmap',
      type: 'Guide',
      likes: 48,
      author: 'Tech Learning Hub'
    },
    {
      _id: '2',
      title: 'Data Structures & Algorithms Cheat Sheet',
      type: 'PDF',
      likes: 32,
      author: 'CS Study Group'
    },
    {
      _id: '3',
      title: 'Top 10 Interview Preparation Resources',
      type: 'Article',
      likes: 27,
      author: 'Career Services'
    }
  ];

  const generateDummyNews = () => [
    {
      _id: '1',
      title: 'University Launches New Tech Innovation Center',
      source: 'Campus News',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString()
    },
    {
      _id: '2',
      title: 'CS Department Announces New AI Specialization Track',
      source: 'Academic Affairs',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    },
    {
      _id: '3',
      title: 'Student Startup Receives $1M in Seed Funding',
      source: 'Innovation Digest',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
    }
  ];

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format time ago for activity feed
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
    
    return 'just now';
  };

  // Get icon component for activity
  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case 'PeopleIcon': return <PeopleIcon />;
      case 'ArticleIcon': return <ArticleIcon />;
      case 'EventIcon': return <EventIcon />;
      case 'MenuBookIcon': return <MenuBookIcon />;
      case 'WorkIcon': return <WorkIcon />;
      default: return <ArticleIcon />;
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Welcome Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 sm:p-10 shadow-lg text-white"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name || 'User'}!</h1>
                <p className="mt-2 text-indigo-100">
                  Here's what's been happening in your campus community.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 relative">
                  <Image
                    src={session?.user?.image || '/default-avatar.png'}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-white"
                  />
                  {session?.user?.role === 'admin' && (
                    <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-xs text-gray-900 font-bold px-2 py-0.5 rounded-full">
                      ADMIN
                    </span>
                  )}
                </div>
                <Link href="/profile" className="bg-white bg-opacity-25 hover:bg-opacity-40 transition-colors duration-200 py-2 px-4 rounded-lg text-sm font-medium">
                  <div className="flex items-center">
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </div>
                </Link>
              </div>
            </div>
          </motion.section>

          {/* Stats Section */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-2">
                  <PeopleIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connections}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Connections</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mb-2">
                  <ArticleIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.posts}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-2">
                  <EventIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.events}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Events</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mb-2">
                  <MenuBookIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resources}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Resources</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-3 mb-2">
                  <WorkIcon className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.jobs}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Jobs</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-teal-100 dark:bg-teal-900 p-3 mb-2">
                  <TrendingUpIcon className="h-6 w-6 text-teal-600 dark:text-teal-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.profileViews}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Profile Views</div>
              </div>
            </div>
          </motion.section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Activity Feed */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className={`flex-shrink-0 mt-1 rounded-full p-2 ${
                        activity.type === 'connection' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'post' ? 'bg-purple-100 text-purple-600' :
                        activity.type === 'event' ? 'bg-green-100 text-green-600' :
                        activity.type === 'resource' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      } dark:bg-opacity-20`}>
                        {getActivityIcon(activity.icon)}
                      </div>
                      <div>
                        <p className="text-gray-700 dark:text-gray-300">{activity.content}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link href="/notifications" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    View all activity →
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Middle Column - Events and Jobs */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                  <EventIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div key={event._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400 mr-2">{formatDate(event.date)}</span>
                        <span>• {event.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link href="/events" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    View all events →
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Job Postings</h2>
                  <WorkIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-4">
                  {recentJobs.map(job => (
                    <div key={job._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>{job.location}</span>
                        <span className="mx-1">•</span>
                        <span className="font-medium">{job.type}</span>
                        <span className="mx-1">•</span>
                        <span>Posted {timeAgo(job.posted)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link href="/jobs" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    View all job postings →
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Right Column - Resources and News */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trending Resources</h2>
                  <MenuBookIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-4">
                  {trendingResources.map(resource => (
                    <div key={resource._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium">
                          {resource.type}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{resource.likes} likes</span>
                        <span className="mx-2">•</span>
                        <span>By {resource.author}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link href="/resources" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    View all resources →
                  </Link>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Campus News</h2>
                  <NewspaperIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-4">
                  {latestNews.map(item => (
                    <div key={item._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{item.source}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link href="/news" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                    View all news →
                  </Link>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Link href="/posts/create" className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                  <ArticleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Create Post</span>
                </Link>
                
                <Link href="/events/create" className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                  <EventIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Add Event</span>
                </Link>
                
                <Link href="/connect/find" className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <PeopleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Find Connections</span>
                </Link>
                
                <Link href="/jobs/create" className="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                  <WorkIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Post Job</span>
                </Link>
                
                <Link href="/resources/share" className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                  <MenuBookIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Share Resource</span>
                </Link>
                
                <Link href="/news/submit" className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                  <NewspaperIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <span className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Submit News</span>
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
  );
}
