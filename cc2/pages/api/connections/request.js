import { updateItem, getItem, getAllItems } from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Send connection request
    try {
      const { fromUserId, toUserId } = req.body;
      if (!fromUserId || !toUserId) {
        return res.status(400).json({ message: 'Missing user IDs' });
      }
      
      // Check if users exist
      const fromUser = await getItem('users', fromUserId);
      const toUser = await getItem('users', toUserId);
      
      if (!fromUser.data || !toUser.data) {
        return res.status(404).json({ message: 'One or both users not found' });
      }
      
      // Check if request already exists
      const requests = toUser.data.requests || [];
      const requestExists = requests.some(req => 
        req === fromUserId || req.toString() === fromUserId
      );
      
      if (requestExists) {
        return res.status(400).json({ message: 'Request already sent' });
      }
      
      // Check if they're already friends
      const friendsTo = toUser.data.friends || [];
      const alreadyFriends = friendsTo.some(friend => 
        friend === fromUserId || friend.toString() === fromUserId
      );
      
      if (alreadyFriends) {
        return res.status(400).json({ message: 'Users are already connected' });
      }
      
      // Add request
      await updateItem('users', toUserId, { $push: { requests: fromUserId } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending connection request:', error);
      return res.status(500).json({ message: 'Failed to send request' });
    }
  } else if (req.method === 'PUT') {
    // Accept/reject connection request
    try {
      const { fromUserId, toUserId, action } = req.body;
      if (!fromUserId || !toUserId || !action) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (action === 'accept') {
        // Add each user to the other's friends list and remove the request
        await updateItem('users', toUserId, { 
          $push: { friends: fromUserId },
          $pull: { requests: fromUserId }
        });
        await updateItem('users', fromUserId, { 
          $push: { friends: toUserId } 
        });
        return res.status(200).json({ success: true, message: 'Connection request accepted' });
      } 
      else if (action === 'reject') {
        // Remove the request
        await updateItem('users', toUserId, { 
          $pull: { requests: fromUserId }
        });
        return res.status(200).json({ success: true, message: 'Connection request rejected' });
      }
      else {
        return res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      console.error('Error handling connection request:', error);
      return res.status(500).json({ message: 'Failed to process request' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
