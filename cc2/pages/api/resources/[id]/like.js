import { updateItem, getItem } from '../../../../utils/db';

const TABLE_NAME = 'Resources';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      // Get current resource to check if it exists
      const resource = await getItem(TABLE_NAME, { id });
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Increment likes
      const currentLikes = resource.likes || 0;
      await updateItem(TABLE_NAME, { id }, { likes: currentLikes + 1 });
      
      res.status(200).json({ message: 'Resource liked successfully' });
    } catch (error) {
      console.error('Error liking resource:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}