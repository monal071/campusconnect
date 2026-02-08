import { connectToDatabase } from "../utils/mongodb";

/**
 * Create MongoDB indexes for performance optimization
 * Run this script: node scripts/create-indexes.js
 */

async function createIndexes() {
  console.log("Creating MongoDB indexes...\n");

  const { db } = await connectToDatabase();

  try {
    // Users Collection
    console.log("📊 Users Collection...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ name: 1 });
    await db.collection("users").createIndex({ role: 1 });
    await db.collection("users").createIndex({ createdAt: -1 });
    await db.collection("users").createIndex({ "profile.university": 1 });
    await db.collection("users").createIndex({ "profile.major": 1 });
    console.log("✅ Users indexes created");

    // Resources Collection
    console.log("\n📊 Resources Collection...");
    await db.collection("resources").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("resources").createIndex({ type: 1 });
    await db.collection("resources").createIndex({ tags: 1 });
    await db.collection("resources").createIndex({ courseId: 1 });
    await db.collection("resources").createIndex({ createdAt: -1 });
    await db.collection("resources").createIndex({ views: -1 });
    await db.collection("resources").createIndex({ averageRating: -1 });
    await db.collection("resources").createIndex(
      {
        title: "text",
        description: "text",
        tags: "text",
      },
      {
        name: "resource_text_search",
      },
    );
    console.log("✅ Resources indexes created");

    // Quizzes Collection
    console.log("\n📊 Quizzes Collection...");
    await db.collection("quizzes").createIndex({ creatorId: 1 });
    await db.collection("quizzes").createIndex({ courseId: 1 });
    await db.collection("quizzes").createIndex({ status: 1 });
    await db.collection("quizzes").createIndex({ startDate: 1, endDate: 1 });
    await db.collection("quizzes").createIndex({ createdAt: -1 });
    await db.collection("quizzes").createIndex({ isPublic: 1 });
    console.log("✅ Quizzes indexes created");

    // Quiz Submissions Collection
    console.log("\n📊 Quiz Submissions Collection...");
    await db
      .collection("quizSubmissions")
      .createIndex({ quizId: 1, userId: 1 });
    await db
      .collection("quizSubmissions")
      .createIndex({ quizId: 1, score: -1 });
    await db
      .collection("quizSubmissions")
      .createIndex({ userId: 1, submittedAt: -1 });
    await db.collection("quizSubmissions").createIndex({ submittedAt: -1 });
    console.log("✅ Quiz Submissions indexes created");

    // Events Collection
    console.log("\n📊 Events Collection...");
    await db.collection("events").createIndex({ creatorId: 1 });
    await db.collection("events").createIndex({ date: 1 });
    await db.collection("events").createIndex({ type: 1 });
    await db.collection("events").createIndex({ location: 1 });
    await db.collection("events").createIndex({ createdAt: -1 });
    await db.collection("events").createIndex({
      date: 1,
      startTime: 1,
    });
    console.log("✅ Events indexes created");

    // RSVPs Collection
    console.log("\n📊 RSVPs Collection...");
    await db
      .collection("rsvps")
      .createIndex({ eventId: 1, userId: 1 }, { unique: true });
    await db.collection("rsvps").createIndex({ eventId: 1, status: 1 });
    await db.collection("rsvps").createIndex({ userId: 1, respondedAt: -1 });
    console.log("✅ RSVPs indexes created");

    // Jobs Collection
    console.log("\n📊 Jobs Collection...");
    await db.collection("jobs").createIndex({ postedBy: 1 });
    await db.collection("jobs").createIndex({ type: 1 });
    await db.collection("jobs").createIndex({ location: 1 });
    await db.collection("jobs").createIndex({ skills: 1 });
    await db.collection("jobs").createIndex({ createdAt: -1 });
    await db.collection("jobs").createIndex({ deadline: 1 });
    await db.collection("jobs").createIndex(
      {
        title: "text",
        description: "text",
        company: "text",
        skills: "text",
      },
      {
        name: "job_text_search",
      },
    );
    console.log("✅ Jobs indexes created");

    // Connections Collection
    console.log("\n📊 Connections Collection...");
    await db.collection("connections").createIndex({ userId: 1 });
    await db.collection("connections").createIndex({ connectedUserId: 1 });
    await db.collection("connections").createIndex(
      {
        userId: 1,
        connectedUserId: 1,
      },
      { unique: true },
    );
    await db.collection("connections").createIndex({ connectedAt: -1 });
    console.log("✅ Connections indexes created");

    // Connection Requests Collection
    console.log("\n📊 Connection Requests Collection...");
    await db
      .collection("connectionRequests")
      .createIndex({ from: 1, to: 1 }, { unique: true });
    await db.collection("connectionRequests").createIndex({ to: 1, status: 1 });
    await db.collection("connectionRequests").createIndex({ from: 1 });
    await db.collection("connectionRequests").createIndex({ createdAt: -1 });
    console.log("✅ Connection Requests indexes created");

    // Notifications Collection
    console.log("\n📊 Notifications Collection...");
    await db.collection("notifications").createIndex({ userId: 1, read: 1 });
    await db
      .collection("notifications")
      .createIndex({ userId: 1, createdAt: -1 });
    await db.collection("notifications").createIndex({ type: 1 });
    await db.collection("notifications").createIndex({ createdAt: -1 });
    console.log("✅ Notifications indexes created");

    // Messages Collection
    console.log("\n📊 Messages Collection...");
    await db
      .collection("messages")
      .createIndex({ senderId: 1, receiverId: 1, timestamp: -1 });
    await db.collection("messages").createIndex({ receiverId: 1, read: 1 });
    await db
      .collection("messages")
      .createIndex({ conversationId: 1, timestamp: -1 });
    await db.collection("messages").createIndex({ timestamp: -1 });
    console.log("✅ Messages indexes created");

    // Resource Comments Collection
    console.log("\n📊 Resource Comments Collection...");
    await db
      .collection("resourceComments")
      .createIndex({ resourceId: 1, createdAt: -1 });
    await db.collection("resourceComments").createIndex({ userId: 1 });
    await db.collection("resourceComments").createIndex({ parentId: 1 });
    console.log("✅ Resource Comments indexes created");

    // Resource Ratings Collection
    console.log("\n📊 Resource Ratings Collection...");
    await db
      .collection("resourceRatings")
      .createIndex({ resourceId: 1, userId: 1 }, { unique: true });
    await db
      .collection("resourceRatings")
      .createIndex({ resourceId: 1, rating: -1 });
    console.log("✅ Resource Ratings indexes created");

    // Resource Collections Collection
    console.log("\n📊 Resource Collections Collection...");
    await db.collection("resourceCollections").createIndex({ userId: 1 });
    await db.collection("resourceCollections").createIndex({ tags: 1 });
    await db.collection("resourceCollections").createIndex({ isPublic: 1 });
    await db.collection("resourceCollections").createIndex({ createdAt: -1 });
    console.log("✅ Resource Collections indexes created");

    // Question Bank Collection
    console.log("\n📊 Question Bank Collection...");
    await db.collection("questionBank").createIndex({ userId: 1 });
    await db.collection("questionBank").createIndex({ category: 1 });
    await db.collection("questionBank").createIndex({ difficulty: 1 });
    await db.collection("questionBank").createIndex({ type: 1 });
    await db.collection("questionBank").createIndex({ tags: 1 });
    console.log("✅ Question Bank indexes created");

    console.log("\n✨ All indexes created successfully!");

    // Display index statistics
    console.log("\n📈 Index Statistics:");
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).indexes();
      console.log(`  ${collection.name}: ${indexes.length} indexes`);
    }
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  createIndexes()
    .then(() => {
      console.log("\n✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Failed:", error);
      process.exit(1);
    });
}

export default createIndexes;
