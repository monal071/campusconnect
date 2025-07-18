import { addItem, getAllItems } from '../../utils/db';

const TABLE_NAME = 'Jobs';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const jobs = await getAllItems(TABLE_NAME);
      res.status(200).json(jobs.items || []);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const job = req.body;
      await addItem(TABLE_NAME, job);
      res.status(201).json({ message: 'Job added' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
