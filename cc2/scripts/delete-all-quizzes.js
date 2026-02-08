const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

/**
 * Script to delete all quizzes from the database
 * Run: node scripts/delete-all-quizzes.js
 */

async function deleteAllQuizzes() {
  console.log("🗑️  Starting quiz deletion process...\n");

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB\n");

    const db = client.db(process.env.MONGODB_DB || "campusconnect");

    // Delete all quizzes
    console.log("Deleting quizzes...");
    const quizzesResult = await db.collection("quizzes").deleteMany({});
    console.log(`✅ Deleted ${quizzesResult.deletedCount} quizzes`);

    // Delete all quiz submissions
    console.log("\nDeleting quiz submissions...");
    const submissionsResult = await db
      .collection("quizSubmissions")
      .deleteMany({});
    console.log(
      `✅ Deleted ${submissionsResult.deletedCount} quiz submissions`,
    );

    // Delete quiz randomizations
    console.log("\nDeleting quiz randomizations...");
    const randomizationsResult = await db
      .collection("quizRandomizations")
      .deleteMany({});
    console.log(
      `✅ Deleted ${randomizationsResult.deletedCount} quiz randomizations`,
    );

    // Optionally delete question bank (uncomment if you want to delete these too)
    // console.log('\nDeleting question bank...');
    // const questionBankResult = await db.collection('questionBank').deleteMany({});
    // console.log(`✅ Deleted ${questionBankResult.deletedCount} questions from question bank`);

    console.log(
      "\n✨ All quizzes and related data have been deleted successfully!",
    );
  } catch (error) {
    console.error("❌ Error deleting quizzes:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the script
deleteAllQuizzes()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  });
