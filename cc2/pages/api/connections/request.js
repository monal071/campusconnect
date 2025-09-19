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
      
      // Create notification for the recipient
      await db.collection('notifications').insertOne({
        userId: toUserId,
        type: 'friend_request',
        message: `${fromUser.name} sent you a friend request`,
        senderId: fromUserId,
        senderName: fromUser.name,
        senderEmail: fromUser.email,
        read: false,
        createdAt: new Date()
      });
      
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
        // Get user details for notifications
        const [fromUser, toUser] = await Promise.all([
          db.collection('users').findOne({ _id: new ObjectId(fromUserId) }),
          db.collection('users').findOne({ _id: new ObjectId(toUserId) })
        ]);
        
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
        
        // Create permanent friendship record
        await db.collection('friendships').insertOne({
          user1Id: fromUserId,
          user2Id: toUserId,
          user1Name: fromUser.name,
          user2Name: toUser.name,
          user1Email: fromUser.email,
          user2Email: toUser.email,
          status: 'active',
          createdAt: new Date(),
          acceptedAt: new Date()
        });
        
        // Create notification for the requester
        await db.collection('notifications').insertOne({
          userId: fromUserId,
          type: 'approval',
          message: `${toUser.name} accepted your friend request`,
          link: '/connections',
          read: false,
          createdAt: new Date()
        });
        
        return res.status(200).json({ success: true, message: 'Connection request accepted' });
      } 
      else if (action === 'reject') {
        // Get user details for notification
        const [fromUser, toUser] = await Promise.all([
          db.collection('users').findOne({ _id: new ObjectId(fromUserId) }),
          db.collection('users').findOne({ _id: new ObjectId(toUserId) })
        ]);
        
        // Remove the request
        await db.collection('users').updateOne(
          { _id: new ObjectId(toUserId) },
          { $pull: { requests: fromUserId } }
        );
        
        // Optionally create a notification for the requester (you can remove this if you don't want to notify on rejection)
        await db.collection('notifications').insertOne({
          userId: fromUserId,
          type: 'rejection',
          message: `Your friend request was declined`,
          link: '/connections',
          read: false,
          createdAt: new Date()
        });
        
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
