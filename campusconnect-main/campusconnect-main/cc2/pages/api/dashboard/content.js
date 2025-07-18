export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;

  try {
    // Mock content data - replace with actual storage logic
    let content = '';
    
    if (type === 'notes') {
      content = '';
    } else if (type === 'tasks') {
      content = [];
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Error fetching dashboard content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
}