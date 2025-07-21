import { addItem, getAllItems, deleteItem } from '../../utils/db';

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
