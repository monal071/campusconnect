import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Add a secret key for security to prevent unauthorized clearing of the database
  const { secretKey } = req.query;
  
  if (secretKey !== 'campusconnect-reset-2025') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Delete all users
    const result = await db.collection('users').deleteMany({});
    
    return res.status(200).json({ 
      message: 'Database cleared successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
