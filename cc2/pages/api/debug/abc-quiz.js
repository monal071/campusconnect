import { clientPromise } from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('campusconnect');

    // Get the abc quiz
    const quiz = await db.collection('quizzes').findOne({
      quizName: 'abc'
    });

    if (!quiz) {
      return res.status(404).json({ message: 'abc quiz not found' });
    }

    const now = new Date();
    let deadline;
    let isValidDeadline = false;
    
    // Handle different date formats
    if (quiz.deadline instanceof Date) {
      deadline = quiz.deadline;
      isValidDeadline = true;
    } else if (typeof quiz.deadline === 'string') {
      deadline = new Date(quiz.deadline);
      isValidDeadline = !isNaN(deadline.getTime());
    } else if (typeof quiz.deadline === 'number') {
      deadline = new Date(quiz.deadline);
      isValidDeadline = !isNaN(deadline.getTime());
    } else {
      deadline = new Date();
      isValidDeadline = false;
    }
    
    // Force valid date calculation
    const isExpired = isValidDeadline && deadline.getTime() < now.getTime();
    
    const processedQuiz = {
      ...quiz,
      isExpired: isExpired,
      timeRemaining: isValidDeadline && deadline.getTime() > now.getTime() ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60)) : 0,
      status: isValidDeadline && deadline.getTime() > now.getTime() ? 'active' : 'expired'
    };

    return res.status(200).json({
      rawQuiz: {
        _id: quiz._id,
        quizName: quiz.quizName,
        deadline: quiz.deadline,
        deadlineType: typeof quiz.deadline
      },
      processedQuiz: {
        _id: processedQuiz._id,
        quizName: processedQuiz.quizName,
        deadline: processedQuiz.deadline,
        isExpired: processedQuiz.isExpired,
        status: processedQuiz.status,
        timeRemaining: processedQuiz.timeRemaining
      },
      calculations: {
        currentTime: now.toISOString(),
        deadlineTime: deadline.toISOString(),
        currentTimestamp: now.getTime(),
        deadlineTimestamp: deadline.getTime(),
        isExpiredCalculation: isExpired,
        timeDifferenceMinutes: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60))
      }
    });

  } catch (error) {
    console.error('Debug abc quiz error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}