// Quick script to make a specific quiz public for easy student access
const { MongoClient, ObjectId } = require('mongodb');

async function makeQuizPublic() {
  console.log('🔧 Making quiz public for easy student access...');
  
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://cc:123%40abc@campusconnect.jligiuz.mongodb.net/?retryWrites=true&w=majority&appName=campusconnect';
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('campusconnect');
    const collection = db.collection('quizzes');
    
    // Find the quiz that's causing issues
    const quizId = '68ce7450679c1736c08a8ba5'; // From the logs
    
    const quiz = await collection.findOne({ _id: new ObjectId(quizId) });
    if (!quiz) {
      console.log('❌ Quiz not found');
      return;
    }
    
    console.log(`📋 Current quiz status:`);
    console.log(`  Name: ${quiz.quizName}`);
    console.log(`  isPublic: ${quiz.isPublic}`);
    console.log(`  isActive: ${quiz.isActive}`);
    console.log(`  password: ${quiz.password ? '[SET]' : '[NOT SET]'}`);
    
    // Update quiz to be public and active
    const result = await collection.updateOne(
      { _id: new ObjectId(quizId) },
      { 
        $set: { 
          isPublic: true,    // Make it public (no password needed)
          isActive: true,    // Ensure it's active
          updatedAt: new Date()
        },
        $unset: {
          password: ""       // Remove password requirement
        }
      }
    );
    
    console.log(`✅ Updated quiz: ${result.modifiedCount} document(s) modified`);
    console.log(`🎯 Quiz "${quiz.quizName}" is now PUBLIC and ACTIVE!`);
    console.log('🎉 Students can now take this quiz without a password!');
    
    await client.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
makeQuizPublic();