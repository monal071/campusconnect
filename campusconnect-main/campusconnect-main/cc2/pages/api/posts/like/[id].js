import { updateItem, getItem } from '../../../../utils/db';

const TABLE_NAME = 'Posts';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      // Get current post to check if it exists
      const post = await getItem(TABLE_NAME, { id });
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }

      // Increment likes
      const currentLikes = post.likes || 0;
      await updateItem(TABLE_NAME, { id }, { likes: currentLikes + 1 });
      
      res.status(200).json({ success: true, message: 'Post liked successfully' });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}