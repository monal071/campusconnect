import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise, { getQuizDb } from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { studentQuestions } from "../../../../lib/quiz-questions";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const { quizId } = req.query;
    if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });
    const client = await clientPromise;
    const quiz = await getQuizDb(client).collection("quizzes").findOne({ _id: new ObjectId(quizId) });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.isActive === false || quiz.deletedAt) return res.status(409).json({ error: "Quiz is not active" });
    return res.status(200).json({ _id: quiz._id, quizName: quiz.quizName, description: quiz.description, timeLimit: quiz.timeLimit, totalPoints: quiz.totalPoints, totalQuestions: quiz.questions.length, isActive: true, allowRetakes: quiz.allowRetakes, showResults: quiz.showResults, questions: studentQuestions(quiz, session.user.id), isRandomized: Boolean(quiz.settings?.randomizeQuestions || quiz.settings?.randomizeOptions) });
  } catch { return res.status(500).json({ error: "Failed to load quiz" }); }
}
