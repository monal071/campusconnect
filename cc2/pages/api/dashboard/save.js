export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content, type } = req.body;

  try {
    // Mock save logic - replace with actual storage
    console.log(`Saving ${type}:`, content);
    
    res.status(200).json({ success: true, message: 'Content saved successfully' });
  } catch (error) {
    console.error('Error saving dashboard content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
}