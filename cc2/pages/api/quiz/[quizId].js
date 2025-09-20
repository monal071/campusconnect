import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log('🔍 Quiz API called:', req.method, 'Quiz ID:', req.query.quizId);
  
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('🔍 Session user:', session?.user?.role, session?.user?.id);
    
    if (!session) {
      console.log('❌ No session found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { quizId } = req.query;
    console.log('🔍 Processing quiz ID:', quizId);
    
    if (!quizId || !ObjectId.isValid(quizId)) {
      console.log('❌ Invalid quiz ID:', quizId);
      return res.status(400).json({ message: 'Valid quiz ID is required' });
    }

    const client = await clientPromise;
    const db = client.db('campusconnect');

    if (req.method === 'GET') {
      console.log('🔍 GET request for quiz');
      // Handle GET request for both faculty and students
      let quiz;
      
      if (session.user.role === 'faculty') {
        console.log('🎓 Faculty user fetching quiz');
        // Faculty can only access their own quizzes for editing
        quiz = await db.collection('quizzes').findOne({
          _id: new ObjectId(quizId),
          $or: [
            { createdBy: session.user.id }, // string format
            { createdBy: new ObjectId(session.user.id) } // ObjectId format
          ]
        });
      } else if (session.user.role === 'student') {
        console.log('🎒 Student user fetching quiz');
        // Students can access any quiz for taking
        quiz = await db.collection('quizzes').findOne({ _id: new ObjectId(quizId) });
        console.log('🔍 Found quiz for student:', quiz ? quiz.quizName : 'Not found');
        
        // Check if quiz is private and requires password
        if (quiz && !quiz.isPublic && quiz.password) {
          const { password } = req.query; // Check for password in query params
          console.log('🔒 Quiz is private, checking password...');
          
          if (!password || password !== quiz.password) {
            console.log('❌ Invalid or missing password');
            // Return basic info for password prompt
            return res.status(200).json({
              _id: quiz._id,
              quizName: quiz.quizName,
              description: quiz.description,
              totalQuestions: quiz.totalQuestions,
              totalPoints: quiz.totalPoints,
              timeLimit: quiz.timeLimit,
              isActive: quiz.isActive,
              isPublic: quiz.isPublic,
              allowRetakes: quiz.allowRetakes,
              showResults: quiz.showResults,
              password: quiz.password, // Include password for verification
              requiresPassword: true
            });
          }
          console.log('✅ Password correct, proceeding with full quiz data');
        }
      }

      if (!quiz) {
        console.log('❌ Quiz not found or access denied');
        return res.status(404).json({ message: 'Quiz not found or access denied' });
      }

      console.log('✅ Quiz found:', quiz.quizName, 'isActive:', quiz.isActive);

      // Check if quiz is active (manual teacher control)
      if (quiz.isActive === false) {
        console.log('❌ Quiz is not active');
        return res.status(400).json({ message: 'Quiz is not active' });
      }

      console.log('✅ Quiz is active, preparing response data');

      // Return appropriate data based on role
      const responseData = {
        _id: quiz._id,
        quizName: quiz.quizName,
        description: quiz.description,
        questions: quiz.questions,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints,
        timeLimit: quiz.timeLimit,
        isActive: quiz.isActive,
        isPublic: quiz.isPublic,
        allowRetakes: quiz.allowRetakes,
        showResults: quiz.showResults,
        category: quiz.category,
        difficulty: quiz.difficulty
      };

      // Include additional fields for faculty
      if (session.user.role === 'faculty') {
        responseData.password = quiz.password;
        responseData.createdAt = quiz.createdAt;
        responseData.updatedAt = quiz.updatedAt;
        responseData.submissions = quiz.submissions;
        responseData.stats = quiz.stats;
      } else {
        // For students, include password for verification but not other sensitive data
        responseData.password = quiz.password;
      }

      console.log('✅ Returning quiz data to', session.user.role);
      return res.status(200).json(responseData);
    }

    // For non-GET requests, require faculty access
    if (session.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Forbidden: Faculty access required' });
    }

    // Verify quiz ownership for faculty operations
    console.log('Session user:', session.user);
    console.log('Looking for quiz with ID:', quizId, 'and createdBy:', session.user.id);
    
    // Try to find quiz with both string and ObjectId createdBy formats
    const quiz = await db.collection('quizzes').findOne({
      _id: new ObjectId(quizId),
      $or: [
        { createdBy: session.user.id }, // string format
        { createdBy: new ObjectId(session.user.id) } // ObjectId format
      ]
    });

    console.log('Found quiz:', quiz ? 'Yes' : 'No');
    if (quiz) {
      console.log('Quiz createdBy:', quiz.createdBy);
      console.log('Session user ID:', session.user.id);
      console.log('Types - Quiz createdBy:', typeof quiz.createdBy, 'Session ID:', typeof session.user.id);
    }

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or access denied' });
    }

    if (req.method === 'PUT') {
      const { 
        quizName, 
        description, 
        questions, 
        deadline, 
        timeLimit, 
        category,
        difficulty,
        isPublic,
        allowRetakes,
        showResults 
      } = req.body;

      // Validation
      if (!quizName?.trim()) {
        return res.status(400).json({ message: 'Quiz name is required' });
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'At least one question is required' });
      }

      // No deadline validation needed - using manual teacher control instead

      // Check if quiz has submissions - restrict certain updates
      const hasSubmissions = quiz.submissions && quiz.submissions.length > 0;
      
      const updateData = {
        quizName: quizName.trim(),
        description: description?.trim() || '',
        timeLimit: timeLimit || 60,
        category: category || 'general',
        difficulty: difficulty || 'medium',
        isPublic: isPublic || false,
        allowRetakes: allowRetakes || false,
        showResults: showResults !== false,
        updatedAt: new Date()
      };

      // Only allow question updates if no submissions exist
      if (!hasSubmissions) {
        updateData.questions = questions.map((q, index) => ({
          id: index + 1,
          question: q.question.trim(),
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          points: q.points || 1,
          explanation: q.explanation || ''
        }));
        updateData.totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
        updateData.totalQuestions = questions.length;
      }

      const result = await db.collection('quizzes').updateOne(
        { _id: new ObjectId(quizId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.status(200).json({ 
        message: 'Quiz updated successfully',
        restrictedUpdate: hasSubmissions ? 'Questions cannot be modified after submissions' : null
      });

    } else if (req.method === 'DELETE') {
      // Check if quiz has submissions
      if (quiz.submissions && quiz.submissions.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete quiz with existing submissions. Consider making it inactive instead.' 
        });
      }

      const result = await db.collection('quizzes').deleteOne({
        _id: new ObjectId(quizId)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.status(200).json({ message: 'Quiz deleted successfully' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Quiz management error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}