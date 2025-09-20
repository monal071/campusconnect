import { getSession } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
let db = client.db('campusconnect');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await client.connect();
    
    // Get session to authenticate user
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { quizId } = req.query;

    if (!quizId) {
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

    // Fetch student's submissions for this quiz
    const submissions = await db.collection('quizSubmissions')
      .find({ 
        quizId: new ObjectId(quizId),
        userId: session.user.id 
      })
      .sort({ submittedAt: -1 })
      .toArray();

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'No submissions found for this quiz' });
    }

    // Get the latest submission (first in sorted array)
    const latestSubmission = submissions[0];

    // Calculate detailed results for each question
    const detailedResults = latestSubmission.answers.map((answer, index) => {
      const question = quiz.questions[index];
      const correctAnswer = question.correctAnswer;
      const isCorrect = answer === correctAnswer;
      
      return {
        questionId: question._id || index,
        question: question.question,
        options: question.options,
        studentAnswer: answer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        points: isCorrect ? (question.points || 1) : 0,
        maxPoints: question.points || 1,
        explanation: question.explanation || null
      };
    });

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
        Math.round(allSubmissions.reduce((sum, sub) => sum + sub.percentage, 0) / allSubmissions.length) : 0,
      highestScore: allSubmissions.length > 0 ? 
        Math.max(...allSubmissions.map(s => s.percentage)) : 0,
      lowestScore: allSubmissions.length > 0 ? 
        Math.min(...allSubmissions.map(s => s.percentage)) : 0
    };

    // Determine student's rank
    const betterScores = allSubmissions.filter(sub => sub.percentage > latestSubmission.percentage).length;
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
          score: latestSubmission.score,
          totalQuestions: latestSubmission.totalQuestions,
          percentage: latestSubmission.percentage,
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
          score: sub.score,
          percentage: sub.percentage,
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