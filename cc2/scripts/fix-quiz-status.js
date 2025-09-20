const { MongoClient } = require('mongodb');

async function fixQuizStatus() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusconnect';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('campusconnect');
    const collection = db.collection('quizzes');

    // Find all quizzes where isActive is undefined or null
    const quizzesWithoutStatus = await collection.find({
      $or: [
        { isActive: { $exists: false } },
        { isActive: null },
        { isActive: undefined }
      ]
    }).toArray();

    console.log(`🔍 Found ${quizzesWithoutStatus.length} quizzes without proper isActive status`);

    if (quizzesWithoutStatus.length > 0) {
      // Set all undefined/null isActive values to true (default active)
      const result = await collection.updateMany(
        {
          $or: [
            { isActive: { $exists: false } },
            { isActive: null },
            { isActive: undefined }
          ]
        },
        {
          $set: {
            isActive: true,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} quizzes to active status`);
    }

    // Display all quiz statuses for verification
    const allQuizzes = await collection.find({}, { 
      projection: { quizName: 1, isActive: 1, createdBy: 1 } 
    }).toArray();

    console.log('\n📊 Current Quiz Status Summary:');
    allQuizzes.forEach(quiz => {
      console.log(`  • ${quiz.quizName}: isActive = ${quiz.isActive} (${typeof quiz.isActive})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixQuizStatus().catch(console.error);