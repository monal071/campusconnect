import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (session.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit quizzes' });
    }

    const { quizId, answers, studentId, studentName, timeSpent, password } = req.body;

    // Validation
    if (!quizId || !ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: 'Valid quiz ID is required' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required' });
    }

    if (!studentId?.trim() || !studentName?.trim()) {
      return res.status(400).json({ message: 'Student ID and name are required' });
    }

    const client = await clientPromise;
    const db = client.db('campusconnect');

    // Get the quiz
    const quiz = await db.collection('quizzes').findOne({ _id: new ObjectId(quizId) });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if quiz is active (manual teacher control)
    if (quiz.isActive === false) {
      return res.status(400).json({ message: 'Quiz is not active' });
    }

    // Check password for protected quizzes
    if (!quiz.isPublic && quiz.password) {
      if (!password || password !== quiz.password) {
        return res.status(403).json({ message: 'Invalid quiz password' });
      }
    }

    // Check if student has already submitted (if retakes not allowed)
    if (!quiz.allowRetakes) {
      const existingSubmission = quiz.submissions?.find(
        submission => submission.studentId === studentId.trim()
      );
      if (existingSubmission) {
        return res.status(400).json({ message: 'You have already submitted this quiz' });
      }
    }

    // Calculate score
    let correctAnswers = 0;
    let totalScore = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const studentAnswer = answers[index] || '';
      const isCorrect = studentAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        totalScore += question.points;
      }

      gradedAnswers.push({
        questionId: question.id,
        question: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    });

    const percentageScore = (totalScore / quiz.totalPoints) * 100;

    // Create submission object
    const submission = {
      submissionId: new ObjectId().toString(),
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      userId: session.user.id,
      submittedAt: new Date(),
      answers: gradedAnswers,
      totalScore,
      maxScore: quiz.totalPoints,
      percentageScore,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent: timeSpent || 0,
      grade: getLetterGrade(percentageScore)
    };

    // Remove previous submission if retakes allowed
    let updatedSubmissions = quiz.submissions || [];
    if (quiz.allowRetakes) {
      updatedSubmissions = updatedSubmissions.filter(
        sub => sub.studentId !== studentId.trim()
      );
    }
    updatedSubmissions.push(submission);

    // Update quiz with new submission and recalculate stats
    const totalSubmissions = updatedSubmissions.length;
    const averageScore = totalSubmissions > 0 
      ? updatedSubmissions.reduce((sum, sub) => sum + sub.percentageScore, 0) / totalSubmissions 
      : 0;

    const updateResult = await db.collection('quizzes').updateOne(
      { _id: new ObjectId(quizId) },
      {
        $set: {
          submissions: updatedSubmissions,
          'stats.totalSubmissions': totalSubmissions,
          'stats.averageScore': Math.round(averageScore * 100) / 100,
          'stats.completionRate': Math.round((totalSubmissions / 100) * 100) / 100,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Return the submission result
    res.status(200).json({
      message: 'Quiz submitted successfully',
      submission: {
        submissionId: submission.submissionId,
        totalScore: submission.totalScore,
        maxScore: submission.maxScore,
        percentageScore: submission.percentageScore,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions,
        grade: submission.grade,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt,
        showResults: quiz.showResults,
        answers: quiz.showResults ? submission.answers : null
      }
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}