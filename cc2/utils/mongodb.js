import { MongoClient } from "mongodb";

// Lazy connection keeps builds independent of credentials and shares one pool.
export function getMongoClient() {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) return Promise.reject(new Error("Set MONGODB_URI in .env.local to connect to the database."));
    const client = new MongoClient(uri, {
      dbName: process.env.MONGODB_DB,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
    });
    global._mongoClientPromise = client.connect().catch(async (error) => {
      global._mongoClientPromise = undefined;
      await client.close().catch(() => {});
      throw error;
    });
  }
  return global._mongoClientPromise;
}

// Preserve existing await clientPromise callers without connecting at import.
const clientPromise = {
  then(resolve, reject) { return getMongoClient().then(resolve, reject); },
};
export default clientPromise;

export async function connectToDatabase() {
  const client = await getMongoClient();
  return { client, db: client.db() };
}
