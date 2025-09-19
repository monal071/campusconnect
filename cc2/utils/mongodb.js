// Updated MongoDB utility for v4+ driver
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

// MongoDB connection options with timeout settings
const mongoOptions = {
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 10000, // 10 seconds
  serverSelectionTimeoutMS: 10000, // 10 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 1, // Maintain at least 1 socket connection
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  // bufferMaxEntries is deprecated in newer MongoDB drivers
  // Using newer connection options instead
  retryWrites: true,
  retryReads: true
};

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, mongoOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, mongoOptions);
  clientPromise = client.connect();
}

export default clientPromise;
