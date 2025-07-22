import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({
        message: 'Not authenticated',
        session: null
      });
    }
    
    // Return the session data for debugging
    return res.status(200).json({
      message: 'Session data',
      session: {
        user: {
          email: session.user.email,
          name: session.user.name,
          role: session.user.role || 'No role found',
          id: session.user.id || 'No ID found'
        },
        expires: session.expires
      }
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return res.status(500).json({
      message: 'Error fetching session data',
      error: error.message
    });
  }
}
