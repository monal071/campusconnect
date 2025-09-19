const bcrypt = require('bcryptjs');
const { getMongoClient } = require('./mongodb');

const COLLECTION_NAME = 'users';

async function createUser(userData) {
  const client = await getMongoClient();
  const db = client.db();
  const users = db.collection(COLLECTION_NAME);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const user = {
    email: userData.email.toLowerCase(),
    password: hashedPassword,
    name: userData.name,
    role: userData.role || 'student', // Default to 'student' if role not provided
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await users.insertOne(user);
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByEmail(email) {
  const client = await getMongoClient();
  const db = client.db();
  const users = db.collection(COLLECTION_NAME);

  try {
    const user = await users.findOne({ email: email.toLowerCase() });
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password);
}

module.exports = {
  createUser,
  getUserByEmail,
  validatePassword,
};
