export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock news data - replace with actual news API
    const articles = [
      {
        url: 'https://example.com/article1',
        title: 'Welcome to CampusConnect News',
        publishedAt: new Date().toISOString(),
      },
      {
        url: 'https://example.com/article2',
        title: 'Latest Updates in Campus Technology',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    res.status(200).json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}