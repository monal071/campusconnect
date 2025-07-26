import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Send connection request
    try {
      const { fromUserId, toUserId } = req.body;
      if (!fromUserId || !toUserId) {
        return res.status(400).json({ message: 'Missing user IDs' });
      }
      
      if (fromUserId === toUserId) {
        return res.status(400).json({ message: 'Cannot send request to yourself' });
      }
      
      const client = await clientPromise;
      const db = client.db();
      
      // Check if users exist
      const [fromUser, toUser] = await Promise.all([
        db.collection('users').findOne({ _id: new ObjectId(fromUserId) }),
        db.collection('users').findOne({ _id: new ObjectId(toUserId) })
      ]);
      
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: 'One or both users not found' });
      }
      
      // Check if request already exists
      const requests = toUser.requests || [];
      const requestExists = requests.some(reqId => 
        reqId.toString() === fromUserId
      );
      
      if (requestExists) {
        return res.status(400).json({ message: 'Request already sent' });
      }
      
      // Check if they're already friends
      const friendsTo = toUser.friends || [];
      const alreadyFriends = friendsTo.some(friendId => 
        friendId.toString() === fromUserId
      );
      
      if (alreadyFriends) {
        return res.status(400).json({ message: 'Users are already connected' });
      }
      
      // Add request to the target user's requests array
      await db.collection('users').updateOne(
        { _id: new ObjectId(toUserId) },
        { $addToSet: { requests: fromUserId } }
      );
      
      return res.status(200).json({ success: true, message: 'Connection request sent' });
    } catch (error) {
      console.error('Error sending connection request:', error);
      return res.status(500).json({ message: 'Failed to send request' });
    }
  } 
  else if (req.method === 'PUT') {
    // Accept/reject connection request
    try {
      const { fromUserId, toUserId, action } = req.body;
      if (!fromUserId || !toUserId || !action) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const client = await clientPromise;
      const db = client.db();
      
      if (action === 'accept') {
        // Add each user to the other's friends list and remove the request
        await Promise.all([
          db.collection('users').updateOne(
            { _id: new ObjectId(toUserId) },
            { 
              $addToSet: { friends: fromUserId },
              $pull: { requests: fromUserId }
            }
          ),
          db.collection('users').updateOne(
            { _id: new ObjectId(fromUserId) },
            { $addToSet: { friends: toUserId } }
          )
        ]);
        
        return res.status(200).json({ success: true, message: 'Connection request accepted' });
      } 
      else if (action === 'reject') {
        // Remove the request
        await db.collection('users').updateOne(
          { _id: new ObjectId(toUserId) },
          { $pull: { requests: fromUserId } }
        );
        
        return res.status(200).json({ success: true, message: 'Connection request rejected' });
      }
      else {
        return res.status(400).json({ message: 'Invalid action. Use "accept" or "reject"' });
      }
    } catch (error) {
      console.error('Error handling connection request:', error);
      return res.status(500).json({ message: 'Failed to process request' });
    }
  }
  else if (req.method === 'DELETE') {
    // Remove connection (unfriend)
    try {
      const { userId1, userId2 } = req.body;
      if (!userId1 || !userId2) {
        return res.status(400).json({ message: 'Missing user IDs' });
      }
      
      const client = await clientPromise;
      const db = client.db();
      
      // Remove each user from the other's friends list
      await Promise.all([
        db.collection('users').updateOne(
          { _id: new ObjectId(userId1) },
          { $pull: { friends: userId2 } }
        ),
        db.collection('users').updateOne(
          { _id: new ObjectId(userId2) },
          { $pull: { friends: userId1 } }
        )
      ]);
      
      return res.status(200).json({ success: true, message: 'Connection removed successfully' });
    } catch (error) {
      console.error('Error removing connection:', error);
      return res.status(500).json({ message: 'Failed to remove connection' });
    }
  } 
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
