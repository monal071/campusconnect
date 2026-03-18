// Script to delete all users from the database
// Run with: node scripts/delete-all-users.js

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function deleteAllUsers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("campusconnect");

    // Delete all users
    const usersResult = await db.collection("users").deleteMany({});
    console.log(`Deleted ${usersResult.deletedCount} users`);

    // Also clear related data
    const sessionsResult = await db.collection("sessions").deleteMany({});
    console.log(`Deleted ${sessionsResult.deletedCount} sessions`);

    const accountsResult = await db.collection("accounts").deleteMany({});
    console.log(`Deleted ${accountsResult.deletedCount} accounts`);

    console.log("\nAll users have been deleted successfully!");
  } catch (error) {
    console.error("Error deleting users:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

deleteAllUsers();
