import { normalizedSubmission } from "../../../lib/quiz-submissions";
import { getQuizDb } from "../../../utils/mongodb";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { quizId } = req.query;

    if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }

    const client = await clientPromise;
    const db = getQuizDb(client);

    // Check if quiz exists and user is the creator
    const quiz = await db.collection('quizzes').findOne({ 
      _id: new ObjectId(quizId) 
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user is the quiz creator or an admin
    if (String(quiz.createdBy) !== session.user.id && session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only view results for your own quizzes.' });
    }

    // Fetch all submissions for this quiz
    const rawSubmissions = await db.collection('quizSubmissions')
      .find({ quizId: new ObjectId(quizId) })
      .sort({ submittedAt: -1 })
      .toArray();
    const submissions = rawSubmissions.map(sub => normalizedSubmission(sub, quiz));

    // Process and format the results
    const processedResults = submissions.map(submission => {
      // Calculate detailed results for each question
      const detailedResults = submission.detailedResults;

      return {
        userId: submission.userId,
        studentName: submission.studentName,
        studentId: submission.studentId,
        score: submission.totalScore,
        totalQuestions: submission.totalQuestions,
        percentage: submission.percentageScore,
        grade: submission.grade,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt,
        detailedResults: detailedResults
      };
    });

    // Calculate quiz statistics
    const totalSubmissions = submissions.length;
    let averageScore = 0;
    let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let averageTimeSpent = 0;

    if (totalSubmissions > 0) {
      const totalPercentage = submissions.reduce((sum, sub) => sum + (sub.percentageScore || 0), 0);
      averageScore = Math.round(totalPercentage / totalSubmissions);

      const totalTime = submissions.reduce((sum, sub) => sum + (sub.timeSpent || 0), 0);
      averageTimeSpent = Math.round(totalTime / totalSubmissions);

      submissions.forEach(sub => {
        if (gradeDistribution.hasOwnProperty(sub.grade?.[0])) {
          gradeDistribution[sub.grade[0]]++;
        }
      });
    }

    const highestScore = totalSubmissions > 0 ? Math.max(...submissions.map(s => s.percentageScore)) : 0;
    const lowestScore = totalSubmissions > 0 ? Math.min(...submissions.map(s => s.percentageScore)) : 0;

    const statistics = {
      totalSubmissions,
      averageScore,
      highestScore,
      lowestScore,
      averageTimeSpent,
      gradeDistribution,
      completionRate: quiz.statistics?.totalAttempts ? 
        Math.round((totalSubmissions / quiz.statistics.totalAttempts) * 100) : 100
    };

    res.status(200).json({
      success: true,
      results: {
        quiz: {
          _id: quiz._id,
          quizName: quiz.quizName,
          description: quiz.description,
          totalQuestions: quiz.questions.length,
          timeLimit: quiz.timeLimit,
          createdAt: quiz.createdAt
        },
        submissions: processedResults,
        statistics: statistics
      }
    });

  } catch (error) {
    console.error('Quiz results fetch error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}