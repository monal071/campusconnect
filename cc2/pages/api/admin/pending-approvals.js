import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      // Get all pending approvals
      const pendingJobs = await db.collection('pending_jobs').find({ status: 'pending' }).toArray();
      const pendingEvents = await db.collection('pending_events').find({ status: 'pending' }).toArray();
      
      return res.status(200).json({
        success: true,
        data: {
          jobs: pendingJobs,
          events: pendingEvents,
          total: pendingJobs.length + pendingEvents.length
        }
      });
    }

    if (req.method === 'POST') {
      const { type, itemId, action, reason } = req.body; // type: 'job' | 'event', action: 'approve' | 'reject'
      
      if (!type || !itemId || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const collectionName = type === 'job' ? 'pending_jobs' : 'pending_events';
      const approvedCollectionName = type === 'job' ? 'Jobs' : 'Events';
      
      // Get the pending item
      const pendingItem = await db.collection(collectionName).findOne({ 
        _id: new ObjectId(itemId) 
      });
      
      if (!pendingItem) {
        return res.status(404).json({ error: 'Pending item not found' });
      }

      if (action === 'approve') {
        // Move to approved collection
        const approvedItem = {
          ...pendingItem,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          status: 'approved'
        };
        delete approvedItem._id; // Remove the old ID to get a new one
        
        await db.collection(approvedCollectionName).insertOne(approvedItem);
        
        // Create success notification for user
        await db.collection('notifications').insertOne({
          userId: pendingItem.createdBy,
          type: type,
          message: `Your ${type} "${pendingItem.title}" has been approved and is now live!`,
          link: type === 'job' ? '/jobs' : '/events',
          read: false,
          createdAt: new Date()
        });
        
        // Update status in pending collection
        await db.collection(collectionName).updateOne(
          { _id: new ObjectId(itemId) },
          { 
            $set: { 
              status: 'approved',
              approvedBy: session.user.id,
              approvedAt: new Date()
            }
          }
        );
        
      } else if (action === 'reject') {
        // Create rejection notification for user
        await db.collection('notifications').insertOne({
          userId: pendingItem.createdBy,
          type: type,
          message: `Your ${type} "${pendingItem.title}" was not approved. ${reason ? 'Reason: ' + reason : ''}`,
          link: '/dashboard',
          read: false,
          createdAt: new Date()
        });
        
        // Update status in pending collection
        await db.collection(collectionName).updateOne(
          { _id: new ObjectId(itemId) },
          { 
            $set: { 
              status: 'rejected',
              rejectedBy: session.user.id,
              rejectedAt: new Date(),
              rejectionReason: reason || ''
            }
          }
        );
      }

      return res.status(200).json({
        success: true,
        message: `${type} ${action}d successfully`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Pending approvals API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
