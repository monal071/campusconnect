import { startQuizAttempt } from "../../../../lib/quiz-attempts";
import { sendApiError } from "../../../../lib/api-errors";
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
    const db = getQuizDb(client);
    if (session.user.role !== "student") return res.status(403).json({ error: "Only students can take quizzes" });
    const quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(quizId) });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.isActive === false || quiz.deletedAt) return res.status(409).json({ error: "Quiz is not active" });
    const attempt = await startQuizAttempt(client, db, String(quiz._id), session.user.id);
    return res.status(200).json({ _id: quiz._id, quizName: quiz.quizName, description: quiz.description, timeLimit: quiz.timeLimit, totalPoints: quiz.totalPoints, totalQuestions: quiz.questions.length, isActive: true, allowRetakes: quiz.allowRetakes, showResults: quiz.showResults, attempt, questions: attempt.quiz.questions, isRandomized: Boolean(quiz.settings?.randomizeQuestions || quiz.settings?.randomizeOptions) });
  } catch (error) { return sendApiError(res, error); }
}
