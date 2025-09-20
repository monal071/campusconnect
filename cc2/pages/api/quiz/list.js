import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { page = 1, limit = 10, search = '', category = '', status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const client = await clientPromise;
    const db = client.db('campusconnect');

    let query = {};
    
    // Role-based filtering
    if (session.user.role === 'faculty') {
      query.createdBy = session.user.id;
    } else {
      // For students, show only public quizzes or quizzes they can access
      query.isPublic = true;
    }

    // Search functionality
    if (search.trim()) {
      query.$or = [
        { quizName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Status filter for faculty
    if (session.user.role === 'faculty' && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        query.deadline = { $gt: now };
      } else if (status === 'expired') {
        query.deadline = { $lte: now };
      }
    }

    // Get total count
    const totalQuizzes = await db.collection('quizzes').countDocuments(query);

    // Get quizzes with pagination
    const quizzes = await db.collection('quizzes')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .project({
        quizName: 1,
        description: 1,
        category: 1,
        difficulty: 1,
        totalQuestions: 1,
        totalPoints: 1,
        timeLimit: 1,
        isPublic: 1,
        allowRetakes: 1,
        showResults: 1,
        isActive: 1, // Include the isActive field for manual control
        createdAt: 1,
        createdByName: 1,
        stats: 1,
        // Include password only for faculty viewing their own quizzes
        ...(session.user.role === 'faculty' ? { password: 1 } : {})
      })
      .toArray();

    // Add computed fields - USE MANUAL CONTROL INSTEAD OF DEADLINE
    const enrichedQuizzes = quizzes.map(quiz => {
      // Use the isActive field for manual teacher control
      const isActive = quiz.isActive === true;
      const status = isActive ? 'active' : 'ended';
      
      console.log(`Quiz: ${quiz.quizName}`);
      console.log(`  isActive field: ${quiz.isActive} (type: ${typeof quiz.isActive})`);
      console.log(`  Calculated isActive: ${isActive}`);
      console.log(`  Final status: ${status}`);
      
      return {
        ...quiz,
        isActive: isActive,
        status: status,
        canTake: isActive // Students can only take active quizzes
      };
    });

    res.status(200).json({
      quizzes: enrichedQuizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalQuizzes / parseInt(limit)),
        totalQuizzes,
        hasNextPage: skip + parseInt(limit) < totalQuizzes,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Quiz list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}