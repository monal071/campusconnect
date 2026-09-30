import { getQuizDb } from "../../../utils/mongodb";
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

      return res.status(403).json({ message: 'Only faculty can end quizzes' });
    }

    const { quizId } = req.body;

    if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    const client = await clientPromise;
    const db = getQuizDb(client);

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

    if (!quiz) {

      return res.status(404).json({ message: 'Quiz not found or you do not have permission to end it' });
    }

    if (quiz.isActive === false) {

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

    if (result.modifiedCount === 0) {

      return res.status(500).json({ message: 'Failed to end quiz' });
    }

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