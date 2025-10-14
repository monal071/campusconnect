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

    const client = await clientPromise;
    const db = client.db('campusconnect');
    
    const { quizId } = req.query;
    const userRole = session.user.role;

    if (userRole === 'student') {
      // Student history: Get quizzes they have submitted from quizSubmissions collection
      const studentEmail = session.user.email;
      const studentId = session.user.id; // Use user ID from session
      
      let submissionQuery = {
        $or: [
          { userId: studentId },
          { userEmail: studentEmail },
          { studentId: session.user.studentId || session.user.email }
        ]
      };
      
      // Add quiz ID filter if provided
      if (quizId && ObjectId.isValid(quizId)) {
        submissionQuery.quizId = new ObjectId(quizId);
      }
      
      // Get submissions from separate collection
      const submissions = await db.collection('quizSubmissions').find(submissionQuery).toArray();
      
      // Get quiz details for each submission
      const quizIds = [...new Set(submissions.map(sub => sub.quizId))];
      const quizzes = await db.collection('quizzes').find({
        _id: { $in: quizIds }
      }).toArray();
      
      // Create quiz lookup map
      const quizLookup = {};
      quizzes.forEach(quiz => {
        quizLookup[quiz._id.toString()] = quiz;
      });

      // For each submission, create history entry
      const history = submissions.map(submission => {
        const quiz = quizLookup[submission.quizId.toString()];
        
        return {
          _id: quiz?._id,
          quizName: quiz?.quizName || submission.quizName,
          subject: quiz?.subject,
          createdBy: quiz?.createdBy,
          endedAt: submission.submittedAt,
          submission: {
            score: submission.totalScore,
            totalScore: submission.maxScore,
            percentage: submission.percentageScore,
            submittedAt: submission.submittedAt,
            timeSpent: submission.timeSpent,
            grade: submission.grade
          }
        };
      });

      return res.status(200).json({
        message: 'Student quiz history retrieved successfully',
        history: history.sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      });

    } else if (userRole === 'faculty' || userRole === 'admin') {
      // Teacher history: Get ALL quizzes created by them (both active and ended for full history view)
      const teacherEmail = session.user.email;
      
      let query = {
        createdBy: teacherEmail
        // Show all quizzes (active and ended) in teacher history for complete overview
      };
      
      // Add quiz ID filter if provided
      if (quizId && ObjectId.isValid(quizId)) {
        query._id = new ObjectId(quizId);
      }
      
      const quizzes = await db.collection('quizzes').find(query).toArray();

      // Get submissions for these quizzes from the separate collection
      const quizIds = quizzes.map(quiz => quiz._id);
      const allSubmissions = await db.collection('quizSubmissions').find({
        quizId: { $in: quizIds }
      }).toArray();

      const history = quizzes.map(quiz => {
        const quizSubmissions = allSubmissions.filter(sub => 
          sub.quizId.toString() === quiz._id.toString()
        );

        return {
          _id: quiz._id,
          quizName: quiz.quizName,
          subject: quiz.subject,
          createdAt: quiz.createdAt,
          endedAt: quiz.endedAt || quiz.updatedAt,
          isActive: quiz.isActive,
          status: quiz.isActive ? 'Active' : 'Ended',
          totalQuestions: quiz.questions?.length || 0,
          totalPoints: quiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0,
          submissions: quizSubmissions.map(sub => ({
            studentId: sub.studentId,
            studentName: sub.studentName,
            score: sub.totalScore,
            totalScore: sub.maxScore,
            percentage: sub.percentageScore,
            submittedAt: sub.submittedAt,
            timeSpent: sub.timeSpent,
            grade: sub.grade
          })),
          submissionCount: quizSubmissions.length,
          averageScore: quizSubmissions.length > 0 
            ? (quizSubmissions.reduce((sum, s) => sum + (s.percentageScore || 0), 0) / quizSubmissions.length).toFixed(1)
            : 0
        };
      });

      return res.status(200).json({
        message: 'Teacher quiz history retrieved successfully',
        history: history.sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      });

    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

  } catch (error) {
    console.error('Quiz history error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}