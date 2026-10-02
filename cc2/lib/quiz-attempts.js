import { ObjectId } from "mongodb";
import { ApiError } from "./api-errors";
import { studentQuestions } from "./quiz-questions";

export function validateAnswers(answers, count) {
  if (!Array.isArray(answers) || answers.length > count || answers.some(a => (typeof a !== "string" && typeof a !== "number") || (typeof a === "string" && a.length > 5000) || (typeof a === "number" && !Number.isFinite(a)))) throw new ApiError(400, "Invalid answers");
}

export function attemptView(attempt, userId) {
  const { quizSnapshot, ...safe } = attempt;
  return { ...safe, serverNow: new Date(), quiz: { ...quizSnapshot, questions: studentQuestions(quizSnapshot, userId) } };
}

export async function startQuizAttempt(client, db, quizId, userId) {
  if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) throw new ApiError(400, "Invalid quiz ID");
  const transaction = client.startSession();
  try {
    const attempt = await transaction.withTransaction(async () => {
      const options = { session: transaction };
      const quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(quizId) }, options);
      if (!quiz || quiz.deletedAt) throw new ApiError(404, "Quiz not found");
      if (!quiz.questions?.length) throw new ApiError(409, "Quiz has no questions");
      if (quiz.isActive === false) throw new ApiError(409, "Quiz is not active");
      const key = `${quizId}:${userId}`;
      const current = await db.collection("quizAttempts").findOne({ _id: key }, options);
      if (current?.status === "active") return current;
      if (!quiz.allowRetakes && await db.collection("quizSubmissions").findOne({ quizId: quiz._id, userId }, options)) throw new ApiError(409, "You have already submitted this quiz");
      const now = new Date();
      const minutes = Number(quiz.timeLimit) > 0 ? Number(quiz.timeLimit) : 60;
      const attempt = { _id: key, attemptId: new ObjectId().toString(), quizId: quiz._id, userId,
        status: "active", startedAt: now, deadline: new Date(now.getTime() + minutes * 60000),
        answers: quiz.questions.map(() => ""), version: 0,
        quizSnapshot: { _id: quiz._id, quizName: quiz.quizName, questions: quiz.questions, timeLimit: minutes, settings: quiz.settings, showResults: quiz.showResults, allowRetakes: quiz.allowRetakes } };
      // The shared quiz write also serializes simultaneous first starts.
      await db.collection("quizzes").updateOne({ _id: quiz._id }, { $inc: { attemptRevision: 1 } }, options);
      await db.collection("quizAttempts").replaceOne({ _id: key }, attempt, { ...options, upsert: true });
      return attempt;
    });
    return attemptView(attempt, userId);
  } finally { await transaction.endSession(); }
}

export async function saveQuizAttempt(db, userId, body) {
  const { quizId, attemptId, answers, version } = body;
  if (typeof quizId !== "string" || !ObjectId.isValid(quizId) || typeof attemptId !== "string" || !Number.isInteger(version)) throw new ApiError(400, "Invalid attempt");
  const filter = { _id: `${quizId}:${userId}`, attemptId, status: "active" };
  const attempt = await db.collection("quizAttempts").findOne(filter);
  if (!attempt) throw new ApiError(409, "This attempt is no longer active");
  validateAnswers(answers, attempt.quizSnapshot.questions.length);
  const now = new Date();
  const updated = await db.collection("quizAttempts").findOneAndUpdate({ ...filter, deadline: { $gt: now }, version }, {
    $set: { answers, savedAt: now }, $inc: { version: 1 },
  }, { returnDocument: "after" });
  if (!updated) throw new ApiError(409, +attempt.deadline <= +now ? "Time is up. Submit your saved answers." : "Answers changed in another tab. Reopen the quiz to resume.");
  return { version: updated.version, savedAt: updated.savedAt };
}
