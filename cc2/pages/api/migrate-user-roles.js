import clientPromise from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Update all users with role 'user' to 'student' (or you can make this configurable)
    const result = await db.collection('users').updateMany(
      { role: 'user' },
      { 
        $set: { 
          role: 'student',  // Default migration to student
          updatedAt: new Date()
        } 
      }
    );
    
    return res.status(200).json({ 
      success: true,
      message: `Updated ${result.modifiedCount} users from 'user' role to 'student' role`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
