import { clientPromise } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('campusconnect');

    // Find the quiz that appears to be problematic (SDV quiz)
    const quiz = await db.collection('quizzes').findOne({
      quizName: 'SDV'
    });

    if (!quiz) {
      return res.status(404).json({ message: 'SDV quiz not found' });
    }

    const now = new Date();
    const deadline = new Date(quiz.deadline);

    return res.status(200).json({
      currentTime: {
        iso: now.toISOString(),
        local: now.toString(),
        timestamp: now.getTime()
      },
      quiz: {
        name: quiz.quizName,
        deadline: {
          raw: quiz.deadline,
          type: typeof quiz.deadline,
          parsed: deadline.toISOString(),
          local: deadline.toString(),
          timestamp: deadline.getTime(),
          isValid: !isNaN(deadline.getTime())
        },
        comparison: {
          isExpired: deadline < now,
          timeDifference: deadline.getTime() - now.getTime(),
          timeDifferenceMinutes: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60))
        }
      }
    });

  } catch (error) {
    console.error('Debug quiz raw error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}