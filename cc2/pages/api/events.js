import { addItem, getAllItems, updateItem, getItem } from '../../utils/db';

const TABLE_NAME = 'Events';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const events = await getAllItems(TABLE_NAME);
      res.status(200).json(events);
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
