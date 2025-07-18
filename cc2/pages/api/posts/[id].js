import { deleteItem, getItem } from '../../../utils/db';

const TABLE_NAME = 'Posts';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await deleteItem(TABLE_NAME, { id });
      res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const post = await getItem(TABLE_NAME, { id });
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found' });
      }
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      console.error('Error getting post:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}