import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { password } = req.query;
  if (!password) return res.status(400).json({ message: 'Password required' });

  const client = await clientPromise;
  const db = client.db('campusconnect');
  const quiz = await db.collection('quizzes').findOne({ password });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  // Check if quiz deadline has passed
  const now = new Date();
  const deadline = new Date(quiz.deadline);
  if (now > deadline) {
    return res.status(403).json({ 
      message: 'Quiz deadline has passed', 
      deadline: quiz.deadline,
      expired: true 
    });
  }

  res.status(200).json({ quiz });
}