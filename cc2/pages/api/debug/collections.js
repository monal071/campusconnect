import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      // List all collections
      const collections = await db.listCollections().toArray();
      console.log("All collections:", collections.map(c => c.name));
      
      // Check Events collection specifically
      const eventsCollection = db.collection('Events');
      const eventsCount = await eventsCollection.countDocuments();
      const eventsSample = await eventsCollection.find({}).limit(5).toArray();
      
      // Check events collection (lowercase)
      const eventsLowerCollection = db.collection('events');
      const eventsLowerCount = await eventsLowerCollection.countDocuments();
      const eventsLowerSample = await eventsLowerCollection.find({}).limit(5).toArray();
      
      res.status(200).json({
        collections: collections.map(c => c.name),
        Events: {
          count: eventsCount,
          sample: eventsSample
        },
        events: {
          count: eventsLowerCount,
          sample: eventsLowerSample
        }
      });
    } catch (error) {
      console.error("Debug collections error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
