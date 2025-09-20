import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting quiz migration...');
    
    const client = await clientPromise;
    const db = client.db('campusconnect');

    // Count existing quizzes
    const totalQuizzes = await db.collection('quizzes').countDocuments({});
    console.log(`📊 Found ${totalQuizzes} quizzes to migrate`);

    // Update all quizzes to be active by default and remove deadline dependency
    const result = await db.collection('quizzes').updateMany(
      {},
      { 
        $set: { 
          isActive: true,
          updatedAt: new Date()
        },
        $unset: {
          deadline: "", // Remove deadline field since we're not using it anymore
          endedAt: "",   // Remove any previous ended timestamps
          timeRemaining: "" // Remove any time remaining calculations
        }
      }
    );

    // Get final counts for reporting
    const activeQuizzes = await db.collection('quizzes').countDocuments({ isActive: true });
    const inactiveQuizzes = await db.collection('quizzes').countDocuments({ isActive: false });

    console.log(`✅ Migration completed successfully!`);
    console.log(`📈 Statistics:`);
    console.log(`  - Total quizzes: ${totalQuizzes}`);
    console.log(`  - Active quizzes: ${activeQuizzes}`);
    console.log(`  - Inactive quizzes: ${inactiveQuizzes}`);
    console.log(`  - Modified count: ${result.modifiedCount}`);

    return res.status(200).json({
      success: true,
      message: 'Quiz migration completed successfully',
      details: {
        totalQuizzes,
        activeQuizzes,
        inactiveQuizzes,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Migration failed', 
      error: error.message 
    });
  }
}