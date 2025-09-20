// Quick script to check and fix quiz isActive field
const { MongoClient } = require('mongodb');

async function checkAndFixQuizzes() {
  console.log('🔍 Checking quiz status in database...');
  
  try {
    // Use the same MongoDB URI pattern as the app
    const uri = process.env.MONGODB_URI || 'mongodb+srv://campus-connect:campus-connect@cluster0.dlcm8.mongodb.net/campusconnect?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('campusconnect');
    const collection = db.collection('quizzes');
    
    // Get all quizzes to check their current status
    const allQuizzes = await collection.find({}).toArray();
    console.log(`\n📊 Found ${allQuizzes.length} total quizzes`);
    
    if (allQuizzes.length === 0) {
      console.log('ℹ️  No quizzes found in database');
      return;
    }
    
    // Check the isActive field status
    const activeQuizzes = allQuizzes.filter(q => q.isActive === true);
    const inactiveQuizzes = allQuizzes.filter(q => q.isActive === false);
    const undefinedQuizzes = allQuizzes.filter(q => q.isActive === undefined || q.isActive === null);
    
    console.log(`\n📈 Quiz Status Breakdown:`);
    console.log(`  • Active (isActive: true): ${activeQuizzes.length}`);
    console.log(`  • Inactive (isActive: false): ${inactiveQuizzes.length}`);
    console.log(`  • Undefined/null isActive: ${undefinedQuizzes.length}`);
    
    // List each quiz with its current status
    console.log(`\n📋 Quiz Details:`);
    allQuizzes.forEach((quiz, index) => {
      console.log(`  ${index + 1}. "${quiz.quizName}"`);
      console.log(`     isActive: ${quiz.isActive} (${typeof quiz.isActive})`);
      console.log(`     createdBy: ${quiz.createdByName || quiz.createdBy}`);
      console.log(`     created: ${quiz.createdAt?.toISOString() || 'Unknown'}`);
    });
    
    // Fix any quizzes with undefined/null isActive
    if (undefinedQuizzes.length > 0) {
      console.log(`\n🔧 Fixing ${undefinedQuizzes.length} quizzes with undefined isActive...`);
      
      const fixResult = await collection.updateMany(
        { 
          $or: [
            { isActive: { $exists: false } },
            { isActive: null },
            { isActive: undefined }
          ]
        },
        { 
          $set: { 
            isActive: true, // Default new quizzes to active
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Fixed ${fixResult.modifiedCount} quizzes`);
    }
    
    await client.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkAndFixQuizzes();