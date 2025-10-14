import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log('🔍 End quiz API called:', req.method, req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('🔍 Session:', session?.user?.role, session?.user?.id);
    
    if (!session || session.user.role !== 'faculty') {
      console.log('❌ Access denied - not faculty');
      return res.status(403).json({ message: 'Only faculty can end quizzes' });
    }

    const { quizId } = req.body;
    console.log('🔍 Quiz ID to end:', quizId);

    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    const client = await clientPromise;
    const db = client.db('campusconnect');
    console.log('🔍 Database connected');

    // Verify the quiz exists and belongs to the teacher
    // Try both string and ObjectId formats for createdBy
    const quiz = await db.collection('quizzes').findOne({
      $and: [
        { _id: new ObjectId(quizId) },
        {
          $or: [
            { createdBy: session.user.id }, // string format
            { createdBy: new ObjectId(session.user.id) } // ObjectId format
          ]
        }
      ]
    });

    console.log('🔍 Found quiz:', quiz ? quiz.quizName : 'Not found');
    console.log('🔍 Session user ID:', session.user.id);
    
    // Debug: Check if quiz exists at all (regardless of creator)
    const anyQuiz = await db.collection('quizzes').findOne({
      _id: new ObjectId(quizId)
    });
    
    if (anyQuiz) {
      console.log('🔍 Quiz exists! createdBy:', anyQuiz.createdBy);
      console.log('🔍 Types - Quiz createdBy:', typeof anyQuiz.createdBy, 'Session ID:', typeof session.user.id);
    } else {
      console.log('🔍 Quiz with this ID does not exist at all');
    }
    
    if (quiz) {
      console.log('🔍 Quiz createdBy:', quiz.createdBy);
      console.log('🔍 Types - Quiz createdBy:', typeof quiz.createdBy, 'Session ID:', typeof session.user.id);
    }

    if (!quiz) {
      console.log('❌ Quiz not found or no permission');
      return res.status(404).json({ message: 'Quiz not found or you do not have permission to end it' });
    }

    if (quiz.isActive === false) {
      console.log('❌ Quiz already ended');
      return res.status(400).json({ message: 'Quiz is already ended' });
    }

    // End the quiz by setting isActive to false
    const result = await db.collection('quizzes').updateOne(
      { _id: new ObjectId(quizId) },
      { 
        $set: { 
          isActive: false,
          endedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('🔍 Update result:', result);

    if (result.modifiedCount === 0) {
      console.log('❌ No documents modified');
      return res.status(500).json({ message: 'Failed to end quiz' });
    }

    console.log(`✅ Quiz "${quiz.quizName}" ended by ${session.user.name}`);

    res.status(200).json({ 
      message: 'Quiz ended successfully',
      quizId,
      endedAt: new Date()
    });

  } catch (error) {
    console.error('❌ End quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}