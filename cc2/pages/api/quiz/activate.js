import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || session.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can activate quizzes' });
    }

    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    const client = await clientPromise;
    const db = client.db('campusconnect');

    // Verify the quiz exists and belongs to the teacher
    const quiz = await db.collection('quizzes').findOne({
      _id: new ObjectId(quizId),
      createdBy: session.user.id
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or you do not have permission to activate it' });
    }

    if (quiz.isActive === true) {
      return res.status(400).json({ message: 'Quiz is already active' });
    }

    // Activate the quiz by setting isActive to true
    const result = await db.collection('quizzes').updateOne(
      { _id: new ObjectId(quizId) },
      { 
        $set: { 
          isActive: true,
          reactivatedAt: new Date(),
          updatedAt: new Date()
        },
        $unset: {
          endedAt: ""  // Remove the ended timestamp
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to activate quiz' });
    }

    console.log(`✅ Quiz "${quiz.quizName}" activated by ${session.user.name}`);

    res.status(200).json({ 
      message: 'Quiz activated successfully',
      quizId,
      reactivatedAt: new Date()
    });

  } catch (error) {
    console.error('❌ Activate quiz error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}