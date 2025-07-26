import { addItem, getAllItems, updateItem, getItem, deleteItem } from '../../utils/db';

const TABLE_NAME = 'Events';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await getAllItems(TABLE_NAME);
      res.status(200).json(result.data || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const event = req.body;
      await addItem(TABLE_NAME, { ...event, joined: [] });
      res.status(201).json({ message: 'Event added' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing event ID' });
      }
      
      const result = await deleteItem(TABLE_NAME, id);
      
      if (result && result.success) {
        res.status(200).json({ success: true, message: 'Event deleted' });
      } else {
        res.status(404).json({ success: false, error: 'Event not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    // Join event: expects { eventId, userId }
    try {
      const { eventId, userId } = req.body;
      if (!eventId || !userId) return res.status(400).json({ error: 'Missing eventId or userId' });
      // Get event
      const eventRes = await getItem(TABLE_NAME, eventId);
      if (!eventRes.success || !eventRes.data) return res.status(404).json({ error: 'Event not found' });
      const joined = Array.isArray(eventRes.data.joined) ? eventRes.data.joined : [];
      if (!joined.includes(userId)) {
        joined.push(userId);
        await updateItem(TABLE_NAME, eventId, { joined });
      }
      res.status(200).json({ success: true, joinedCount: joined.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
