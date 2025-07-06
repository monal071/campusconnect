import { addItem, getAllItems } from '../../utils/db';

const TABLE_NAME = 'Resources';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const resources = await getAllItems(TABLE_NAME);
      res.status(200).json(resources);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const resource = req.body;
      await addItem(TABLE_NAME, resource);
      res.status(201).json({ message: 'Resource added' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
