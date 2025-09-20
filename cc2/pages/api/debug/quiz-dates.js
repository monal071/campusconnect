import clientPromise from '../../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('campusconnect');
    
    // Get the first few quizzes to see their deadline format
    const quizzes = await db.collection('quizzes').find({}).limit(3).toArray();
    
    const now = new Date();
    
    const analysis = quizzes.map(quiz => {
      const deadline = new Date(quiz.deadline);
      return {
        quizName: quiz.quizName,
        deadline: {
          raw: quiz.deadline,
          type: typeof quiz.deadline,
          parsed: deadline.toISOString(),
          local: deadline.toLocaleString(),
          isValid: !isNaN(deadline.getTime())
        },
        comparison: {
          now: now.toISOString(),
          isExpired: deadline < now,
          minutesFromNow: Math.ceil((deadline - now) / (1000 * 60))
        }
      };
    });
    
    res.status(200).json({
      currentTime: now.toISOString(),
      quizAnalysis: analysis
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}