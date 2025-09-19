import { getServerSession } from "next-auth/next";
import { authOptions } from './auth/[...nextauth]';
import clientPromise from '../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the session from the server side
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        session: null
      });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Look up the user by email
    const user = await db.collection('users').findOne({ 
      email: session.user.email.toLowerCase() 
    });
    
    return res.status(200).json({
      session: {
        user: {
          email: session.user.email,
          name: session.user.name,
          id: session.user.id,
          role: session.user.role
        }
      },
      dbUser: user ? {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } : null
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
