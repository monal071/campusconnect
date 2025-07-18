import { getAllItems } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock dashboard data - replace with actual data fetching logic
    const dashboardData = {
      user: {
        name: 'Demo User',
        email: 'demo@example.com',
        image: '/campusconnect-logo.svg',
        joinedDate: new Date().toISOString(),
      },
      stats: {
        connections: 0,
        posts: 0,
        events: 0,
        profileViews: 0,
      },
      recentActivity: [
        {
          type: 'connection',
          title: 'Welcome to CampusConnect!',
          timestamp: new Date().toISOString(),
        },
      ],
      upcomingEvents: [],
      recentPosts: [],
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}