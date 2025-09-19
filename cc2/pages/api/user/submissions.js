import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user's pending submissions
    const pendingJobs = await db.collection('pending_jobs')
      .find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();
      
    const pendingEvents = await db.collection('pending_events')
      .find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data: {
        jobs: pendingJobs,
        events: pendingEvents,
        total: pendingJobs.length + pendingEvents.length
      }
    });
    
  } catch (error) {
    console.error('User submissions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
