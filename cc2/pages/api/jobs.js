import { addItem, getAllItems, deleteItem } from '../../utils/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from '../../utils/mongodb';

const TABLE_NAME = 'Jobs';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const jobs = await getAllItems(TABLE_NAME);
      // Fix: Return the items array directly, not wrapped in an object
      const validJobs = (Array.isArray(jobs) ? jobs : (jobs.items || [])).filter(job => 
        job && 
        typeof job === 'object' && 
        job.title && 
        job.description !== undefined
      );
      res.status(200).json(validJobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const job = req.body;
      const client = await clientPromise;
      const db = client.db();

      if (session.user.role === 'admin') {
        // Admins can directly add jobs
        await addItem(TABLE_NAME, {
          ...job,
          createdBy: session.user.id,
          createdAt: new Date(),
          status: 'approved'
        });
        res.status(201).json({ message: 'Job added successfully' });
      } else {
        // Regular users submit for approval
        await db.collection('pending_jobs').insertOne({
          ...job,
          createdBy: session.user.id,
          createdAt: new Date(),
          status: 'pending',
          submittedBy: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          }
        });

        // Notify all admins about new pending job
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        const notifications = admins.map(admin => ({
          userId: admin._id.toString(),
          type: 'job',
          message: `New job "${job.title}" submitted by ${session.user.name} awaiting approval`,
          link: '/admin',
          read: false,
          createdAt: new Date()
        }));
        
        if (notifications.length > 0) {
          await db.collection('notifications').insertMany(notifications);
        }

        res.status(201).json({ 
          message: 'Job submitted for approval. You will be notified once reviewed.',
          isPending: true 
        });
      }
    } catch (error) {
      console.error('Job submission error:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing job ID' });
      }
      
      const result = await deleteItem(TABLE_NAME, id);
      
      if (result && result.success) {
        res.status(200).json({ success: true, message: 'Job deleted' });
      } else {
        res.status(404).json({ success: false, error: 'Job not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
