import { getServerSession } from "next-auth";
import { authOptions } from './[...nextauth]';
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the session from the server side
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user || !session.user.email) {
      console.log('❌ Complete registration: No session found');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { role, adminPassword } = req.body;
    
    console.log('📝 Complete registration request:', { 
      email: session.user.email, 
      role,
      hasAdminPassword: !!adminPassword 
    });
    
    // Validate required fields
    if (!role) {
      console.log('❌ Complete registration: No role provided');
      return res.status(400).json({ message: 'Role is required' });
    }
    
    // Validate admin password if user is trying to register as admin
    if (role === 'admin' && adminPassword !== '12345678') {
      console.log('❌ Complete registration: Invalid admin password');
      return res.status(403).json({ message: 'Invalid admin password' });
    }
    
    // Validate faculty password if user is trying to register as faculty
    if (role === 'faculty' && req.body.facultyPassword !== '12345678') {
      console.log('❌ Complete registration: Invalid faculty password');
      return res.status(403).json({ message: 'Invalid faculty password' });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Update user with role
    const updateResult = await db.collection('users').updateOne(
      { email: session.user.email.toLowerCase() },
      { 
        $set: { 
          role,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Complete registration: Updated user', { 
      email: session.user.email, 
      role, 
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount 
    });
    
    return res.status(200).json({ 
      success: true,
      role
    });
  } catch (error) {
    console.error('❌ Complete registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
