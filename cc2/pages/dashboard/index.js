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
    jobs: 0
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
      if (statsRes.ok && statsData.data) {
        setStats(statsData.data);
      } else {
        setStats({
          connections: 0,
          posts: 0,
          events: 0,
          resources: 0,
          jobs: 0
        });
      }

      // Fetch recent activity
      const activityRes = await fetch('/api/dashboard/activity');
      const activityData = await activityRes.json();
      if (activityRes.ok && activityData.data) {
        setRecentActivity(activityData.data || []);
      } else {
        setRecentActivity([]);
      }

      // Fetch upcoming events
      const eventsRes = await fetch('/api/events?limit=3');
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        setUpcomingEvents(eventsData.data || []);
      } else {
        setUpcomingEvents([]);
      }

      // Fetch recent jobs
      const jobsRes = await fetch('/api/jobs?limit=3');
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) {
        setRecentJobs(jobsData || []);
      } else {
        setRecentJobs([]);
      }

      // Fetch trending resources
      const resourcesRes = await fetch('/api/resources?limit=3&sort=popular');
      const resourcesData = await resourcesRes.json();
      if (resourcesRes.ok) {
        setTrendingResources(resourcesData.data || []);
      } else {
        setTrendingResources([]);
      }

      // Fetch latest news
      const newsRes = await fetch('/api/news?limit=3');
      const newsData = await newsRes.json();
      if (newsRes.ok) {
        setLatestNews(newsData || []);
      } else {
        setLatestNews([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty arrays instead of dummy data
      setStats({
        connections: 0,
        posts: 0,
        events: 0,
        resources: 0,
        jobs: 0
      });
      setRecentActivity([]);
      setUpcomingEvents([]);
      setRecentJobs([]);
      setTrendingResources([]);
      setLatestNews([]);
    } finally {
      setLoading(false);
    }
  };

  // All dummy data generation functions have been removed to only use real-time data

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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
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
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">No recent activity to display</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your activity will appear here as you interact with the platform</p>
                    </div>
                  )}
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
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => (
                      <div key={event._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400 mr-2">{formatDate(event.date)}</span>
                          <span>• {event.location}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">No upcoming events</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later or create an event</p>
                    </div>
                  )}
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
                  {recentJobs.length > 0 ? (
                    recentJobs.map(job => (
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
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">No job postings available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for new opportunities</p>
                    </div>
                  )}
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
                  {trendingResources.length > 0 ? (
                    trendingResources.map(resource => (
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
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">No resources available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to share educational resources</p>
                    </div>
                  )}
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
                  {latestNews.length > 0 ? (
                    latestNews.map(item => (
                      <div key={item._id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{item.source}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400">No news articles available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for campus news updates</p>
                    </div>
                  )}
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
