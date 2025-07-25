import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

class DatabaseError extends Error {
  constructor(message, operation, collectionName, error) {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.collectionName = collectionName;
    this.originalError = error;
  }
}

// Add an item to a MongoDB collection
async function addItem(collectionName, item) {
  try {
    const client = await clientPromise;
    const db = client.db();
    item.createdAt = item.createdAt || new Date();
    item.updatedAt = new Date();
    const result = await db.collection(collectionName).insertOne(item);
    return { success: true, data: { ...item, _id: result.insertedId } };
  } catch (error) {
    console.error(`Error adding item to ${collectionName}:`, error);
    throw new DatabaseError('Failed to add item to database', 'CREATE', collectionName, error);
  }
}

// Get all items from a MongoDB collection
async function getAllItems(collectionName, options = {}) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const items = await db.collection(collectionName).find({}).toArray();
    return { success: true, data: items };
  } catch (error) {
    console.error(`Error getting items from ${collectionName}:`, error);
    throw new DatabaseError('Failed to get items from database', 'READ', collectionName, error);
  }
}

// Update an item by _id
async function updateItem(collectionName, id, update) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Check if the update already has MongoDB operators ($set, $push, etc.)
    const hasOperators = Object.keys(update).some(key => key.startsWith('$'));
    
    // If the update already has operators, use it directly
    // Otherwise, wrap it in a $set operation
    const updateOperation = hasOperators ? update : { $set: update };
    
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(id) }, 
      updateOperation
    );
    
    return { success: result.modifiedCount > 0 };
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw new DatabaseError('Failed to update item in database', 'UPDATE', collectionName, error);
  }
}

// Delete an item by _id
async function deleteItem(collectionName, id) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
    return { success: result.deletedCount > 0 };
  } catch (error) {
    console.error(`Error deleting item from ${collectionName}:`, error);
    throw new DatabaseError('Failed to delete item from database', 'DELETE', collectionName, error);
  }
}

// Get a single item by _id
async function getItem(collectionName, id) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const item = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
    return { success: true, data: item };
  } catch (error) {
    console.error(`Error getting item from ${collectionName}:`, error);
    throw new DatabaseError('Failed to get item from database', 'READ_ONE', collectionName, error);
  }
}

export {
  addItem,
  getAllItems,
  updateItem,
  deleteItem,
  getItem,
  DatabaseError,
};
