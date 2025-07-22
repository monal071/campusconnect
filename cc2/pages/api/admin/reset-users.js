import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  // Only allow this in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Delete all users
    const result = await db.collection('users').deleteMany({});
    
    return res.status(200).json({ 
      message: 'All users deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    return res.status(500).json({ message: 'Error deleting users' });
  }
}
