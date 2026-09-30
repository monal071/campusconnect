import { normalizedSubmission } from "../../../lib/quiz-submissions";
import { getQuizDb } from "../../../utils/mongodb";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = getQuizDb(client);
    
    // Get session to authenticate user
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { quizId } = req.query;

    if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }

    // Fetch the quiz to verify it exists
    const quiz = await db.collection('quizzes').findOne({ _id: new ObjectId(quizId) });
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.showResults === false) return res.status(403).json({ message: "The teacher has not enabled results for this quiz" });
    // Fetch student's submissions for this quiz
    const rawSubmissions = await db.collection('quizSubmissions')
      .find({ 
        quizId: new ObjectId(quizId),
        userId: session.user.id 
      })
      .sort({ submittedAt: -1 })
      .toArray();
    const submissions = rawSubmissions.map(sub => normalizedSubmission(sub, quiz));

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'No submissions found for this quiz' });
    }

    // Get the latest submission (first in sorted array)
    const latestSubmission = submissions[0];

    // Calculate detailed results for each question
    const detailedResults = latestSubmission.detailedResults;

    // Calculate performance metrics
    const totalCorrect = detailedResults.filter(r => r.isCorrect).length;
    const totalQuestions = quiz.questions.length;
    const correctPercentage = Math.round((totalCorrect / totalQuestions) * 100);

    // Fetch quiz statistics for context
    const allSubmissions = await db.collection('quizSubmissions')
      .find({ quizId: new ObjectId(quizId) })
      .toArray();

    const classStats = {
      totalSubmissions: allSubmissions.length,
      averageScore: allSubmissions.length > 0 ? 
        Math.round(allSubmissions.reduce((sum, sub) => sum + (sub.percentageScore ?? sub.percentage ?? 0), 0) / allSubmissions.length) : 0,
      highestScore: allSubmissions.length > 0 ? 
        Math.max(...allSubmissions.map(s => (s.percentageScore ?? s.percentage ?? 0))) : 0,
      lowestScore: allSubmissions.length > 0 ? 
        Math.min(...allSubmissions.map(s => (s.percentageScore ?? s.percentage ?? 0))) : 0
    };

    // Determine student's rank
    const betterScores = allSubmissions.filter(sub => (sub.percentageScore ?? sub.percentage ?? 0) > latestSubmission.percentageScore).length;
    const rank = betterScores + 1;
    const totalStudents = allSubmissions.length;

    res.status(200).json({
      success: true,
      result: {
        quiz: {
          _id: quiz._id,
          quizName: quiz.quizName,
          description: quiz.description,
          totalQuestions: quiz.questions.length,
          timeLimit: quiz.timeLimit
        },
        submission: {
          score: latestSubmission.totalScore,
          totalQuestions: latestSubmission.totalQuestions,
          percentage: latestSubmission.percentageScore,
          grade: latestSubmission.grade,
          timeSpent: latestSubmission.timeSpent,
          submittedAt: latestSubmission.submittedAt,
          detailedResults: detailedResults
        },
        performance: {
          correctAnswers: totalCorrect,
          incorrectAnswers: totalQuestions - totalCorrect,
          accuracy: correctPercentage,
          rank: rank,
          totalStudents: totalStudents,
          betterThanPercent: Math.round(((totalStudents - rank) / totalStudents) * 100)
        },
        classStatistics: classStats,
        allSubmissions: submissions.map(sub => ({
          submittedAt: sub.submittedAt,
          score: sub.totalScore,
          percentage: (sub.percentageScore ?? sub.percentage ?? 0),
          grade: sub.grade,
          timeSpent: sub.timeSpent
        }))
      }
    });

  } catch (error) {
    console.error('Student results fetch error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}