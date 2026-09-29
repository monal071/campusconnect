import { MongoClient } from 'mongodb';

// Read-only connection diagnostic. Credentials come from the environment.
const timeout = setTimeout(() => { console.error('Database connection timed out. Check network access and Atlas IP permissions.'); process.exit(1); }, 15000);
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
try {
  await client.connect();
  await client.db(process.env.MONGODB_DB).command({ ping: 1 });
  console.log('MongoDB connection is ready.');
} catch (error) {
  console.error('Database check failed:', error.name, error.code || 'connection');
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await client.close();
}
