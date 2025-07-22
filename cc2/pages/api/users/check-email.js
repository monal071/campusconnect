import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Look up the user by email
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    });
    
    // Return registration status
    if (user) {
      return res.status(200).json({
        exists: true,
        isRegistered: user.isRegistered === true,
        needsRegistration: user.isRegistered !== true
      });
    } else {
      return res.status(200).json({
        exists: false,
        isRegistered: false,
        needsRegistration: false
      });
    }
  } catch (error) {
    console.error('User check error:', error);
    return res.status(500).json({ 
      message: 'Internal server error'
    });
  }
}
