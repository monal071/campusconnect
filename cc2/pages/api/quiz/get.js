import { startQuizAttempt } from "../../../lib/quiz-attempts";
import { sendApiError } from "../../../lib/api-errors";
import { studentQuestions } from "../../../lib/quiz-questions";
import { getQuizDb } from "../../../utils/mongodb";
import clientPromise from "../../../utils/mongodb";

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  try {
    if (req.method !== "GET")
      return res.status(405).json({ message: "Method not allowed" });

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { code } = req.query;
    if (typeof code !== "string" || !code.trim() || code.length > 20) return res.status(400).json({ message: "Quiz code required" });

    const client = await clientPromise;
    const db = getQuizDb(client);

    // Search for quiz by code (case-insensitive)
    const quiz = await db.collection("quizzes").findOne({
      quizCode: code.trim().toUpperCase(),
    });

    if (!quiz) {

      return res
        .status(404)
        .json({
          message: "Quiz not found. Please check the code and try again.",
        });
    }

    // Check if quiz is active (manual teacher control)
    if (quiz.isActive === false) {
      return res.status(403).json({
        message: "This quiz is no longer active",
        isActive: false,
      });
    }

    const attempt = session.user.role === "student" ? await startQuizAttempt(client, db, String(quiz._id), session.user.id) : null;
    const responseQuiz = {
      _id: quiz._id,
      quizName: quiz.quizName,
      description: quiz.description,
      questions: attempt ? attempt.quiz.questions : studentQuestions(quiz, session.user.id),
      attempt,
      totalQuestions: quiz.totalQuestions,
      totalPoints: quiz.totalPoints,
      timeLimit: quiz.timeLimit,
      isActive: quiz.isActive,
      allowRetakes: quiz.allowRetakes,
      showResults: quiz.showResults,
      category: quiz.category,
      difficulty: quiz.difficulty,
      quizCode: quiz.quizCode,
      createdByName: quiz.createdByName || "Unknown",
      createdAt: quiz.createdAt,
    };

    res.status(200).json({ quiz: responseQuiz });
  } catch (error) {
    console.error("Quiz get API error:", error);
    return sendApiError(res, error);
  }
}
