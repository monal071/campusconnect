import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Forbidden: Faculty access required' });
    }

    const { 
      quizName, 
      description, 
      questions, 
      timeLimit, 
      category,
      difficulty,
      isPublic,
      allowRetakes,
      showResults,
      password 
    } = req.body;

    // Validation
    if (!quizName?.trim()) {
      return res.status(400).json({ message: 'Quiz name is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question?.trim()) {
        return res.status(400).json({ message: `Question ${i + 1} text is required` });
      }
      
      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length < 2) {
          return res.status(400).json({ message: `Question ${i + 1} must have at least 2 options` });
        }
        if (!question.correctAnswer) {
          return res.status(400).json({ message: `Question ${i + 1} must have a correct answer` });
        }
      }
    }

    // Validate password for non-public quizzes
    if (!isPublic && !password?.trim()) {
      return res.status(400).json({ message: 'Password is required for private quizzes' });
    }

    // Generate password if public quiz, use provided password if private
    const quizPassword = isPublic ? null : password.trim();
    
    const client = await clientPromise;
    const db = client.db('campusconnect');
    
    const quiz = {
      quizName: quizName.trim(),
      description: description?.trim() || '',
      questions: questions.map((q, index) => ({
        id: index + 1,
        question: q.question.trim(),
        type: q.type || 'multiple-choice',
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1,
        explanation: q.explanation || ''
      })),
      password: quizPassword,
      timeLimit: timeLimit || 60, // minutes - only for individual quiz attempts
      category: category || 'general',
      difficulty: difficulty || 'medium',
      isPublic: isPublic || false,
      allowRetakes: allowRetakes || false,
      showResults: showResults !== false, // default true
      isActive: true, // Quiz starts as active, teacher can end it manually
      createdBy: session.user.id,
      createdByName: session.user.name || session.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      submissions: [],
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      totalQuestions: questions.length,
      stats: {
        totalSubmissions: 0,
        averageScore: 0,
        completionRate: 0
      }
    };

    const result = await db.collection('quizzes').insertOne(quiz);
    
    res.status(201).json({ 
      message: 'Quiz created successfully',
      quizId: result.insertedId, 
      password: quizPassword,
      quiz: {
        _id: result.insertedId,
        quizName: quiz.quizName,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints,
        timeLimit: quiz.timeLimit,
        isActive: quiz.isActive,
        password: quiz.password
      }
    });

  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}