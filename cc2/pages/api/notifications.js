export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock notifications data
    const notifications = [
      {
        _id: '1',
        type: 'connection',
        message: 'Welcome to CampusConnect!',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/dashboard',
      },
    ];

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}