import { addItem, getAllItems } from '../../utils/db';

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
      await addItem(TABLE_NAME, event);
      res.status(201).json({ message: 'Event added' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
