import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'POST') {
      // Submit quiz answers (Students only)
      if (session.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit quizzes' });
      }

      const { password, answers, studentId, timeTaken } = req.body;

      if (!password || !answers || !studentId) {
        return res.status(400).json({ message: 'Password, answers, and student ID are required' });
      }

      // Find quiz by password
      const quiz = await db.collection('quizzes').findOne({ 
        password: password.toUpperCase(),
        isActive: true 
      });

      if (!quiz) {
        return res.status(404).json({ message: 'Invalid quiz password' });
      }

      // Check if student already submitted
      const existingSubmission = quiz.submissions?.find(sub => sub.studentId === studentId);
      if (existingSubmission) {
        return res.status(400).json({ message: 'You have already submitted this quiz' });
      }

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      for (let i = 0; i < quiz.questions.length; i++) {
        if (answers[i] === quiz.questions[i].correctAnswer) {
          correctAnswers++;
        }
      }

      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Create submission
      const submission = {
        studentId,
        studentName: session.user.name,
        submittedBy: new ObjectId(session.user.id),
        answers,
        score,
        correctAnswers,
        totalQuestions,
        timeTaken: timeTaken || 0,
        submittedAt: new Date()
      };

      // Add submission to quiz
      await db.collection('quizzes').updateOne(
        { _id: quiz._id },
        { $push: { submissions: submission } }
      );

      res.status(200).json({
        message: 'Quiz submitted successfully',
        score,
        correctAnswers,
        totalQuestions
      });

    } else if (req.method === 'GET') {
      // Get quiz by password (for taking quiz)
      const { password } = req.query;

      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      const quiz = await db.collection('quizzes').findOne(
        { 
          password: password.toUpperCase(),
          isActive: true 
        },
        {
          projection: {
            quizName: 1,
            questions: {
              $map: {
                input: '$questions',
                as: 'question',
                in: {
                  question: '$$question.question',
                  options: '$$question.options'
                  // Don't include correctAnswer for students
                }
              }
            },
            timeLimit: 1,
            createdByName: 1
          }
        }
      );

      if (!quiz) {
        return res.status(404).json({ message: 'Invalid quiz password' });
      }

      res.status(200).json({ quiz });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Quiz submission API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}