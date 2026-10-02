import { validateAnswers } from "./quiz-attempts";
import { quizQuestions } from "./quiz-questions";
import { ObjectId } from "mongodb";
import { ApiError } from "./api-errors";

export function gradeAnswers(quiz, answers) {
  return quiz.questions.map((question, index) => {
    const answer = answers[index] ?? "";
    const expected = typeof question.correctAnswer === "number" && Array.isArray(question.options) ? question.options[question.correctAnswer] : question.correctAnswer;
    const actual = typeof answer === "number" && Array.isArray(question.options) ? question.options[answer] : answer;
    const isCorrect = actual !== "" && actual === expected;
    const points = Number.isFinite(question.points) && question.points > 0 ? question.points : 1;
    return { questionId: question.id ?? question._id ?? index, question: question.question, options: question.options, studentAnswer: actual, correctAnswer: expected, isCorrect, points: isCorrect ? points : 0, maxPoints: points, explanation: question.explanation || null };
  });
}

export function normalizedSubmission(submission, quiz) {
  const answers = submission.answers || [];
  const detailedResults = answers.length && typeof answers[0] === "object" ? answers : gradeAnswers(quiz, answers);
  return { ...submission, detailedResults, totalScore: submission.totalScore ?? submission.score ?? 0, percentageScore: submission.percentageScore ?? submission.percentage ?? 0 };
}

export async function submitQuiz(client, db, user, body) {
  const { quizId, attemptId } = body;
  if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) throw new ApiError(400, "Invalid quiz ID");
  if (typeof attemptId !== "string") throw new ApiError(409, "Start this quiz before submitting");
  const transaction = client.startSession();
  try {
    return await transaction.withTransaction(async () => {
      const options = { session: transaction };
      let quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(quizId) }, options);
      if (!quiz) throw new ApiError(404, "Quiz not found");
      if (quiz.isActive === false || quiz.deletedAt) throw new ApiError(409, "Quiz is not active");
      const attempt = await db.collection("quizAttempts").findOne({ _id: `${quizId}:${user.id}`, attemptId }, options);
      if (!attempt) throw new ApiError(409, "Start this quiz before submitting");
      if (attempt.status === "submitted") return { ...attempt.result, submission: { ...attempt.result.submission, showResults: quiz.showResults !== false, answers: quiz.showResults === false ? null : attempt.result.submission.answers } };
      const now = new Date();
      const timedOut = now >= attempt.deadline;
      // Late clients may finalize saved work, but cannot change answers after the deadline.
      if (!timedOut && body.version !== attempt.version) throw new ApiError(409, "Answers changed in another tab. Reopen the quiz before submitting.");
      const answers = timedOut ? attempt.answers : body.answers;
      validateAnswers(answers, attempt.quizSnapshot.questions.length);
      const timeSpent = Math.min(Math.max(0, Math.floor((now - attempt.startedAt) / 1000)), Math.floor((attempt.deadline - attempt.startedAt) / 1000));
      quiz = { ...quiz, ...attempt.quizSnapshot, showResults: quiz.showResults };
      const existing = await db.collection("quizSubmissions").findOne({ quizId: quiz._id, $or: [{ userId: user.id }, { userEmail: user.email }] }, options);
      if (!quiz.allowRetakes && existing) throw new ApiError(409, "You have already submitted this quiz");
      const ordered = quizQuestions(quiz, user.id);
      const graded = gradeAnswers({ ...quiz, questions: ordered }, answers);
      const canonicalAnswers = ordered.map((question, index) => ({ originalIndex: question.originalIndex, answer: graded[index] })).sort((a, b) => a.originalIndex - b.originalIndex).map(item => item.answer);
      const totalScore = graded.reduce((sum, a) => sum + a.points, 0);
      const maxScore = graded.reduce((sum, a) => sum + a.maxPoints, 0);
      const percentageScore = Math.round(totalScore / maxScore * 10000) / 100;
      const submission = { _id: new ObjectId(), submissionId: new ObjectId().toString(), quizId: quiz._id, quizName: quiz.quizName, userId: user.id, userEmail: user.email, studentId: user.studentId || user.enrollmentNo || user.email.split("@")[0].toUpperCase(), studentName: user.name, answers: canonicalAnswers, totalScore, maxScore, percentageScore, correctAnswers: graded.filter(a => a.isCorrect).length, totalQuestions: graded.length, timeSpent, grade: percentageScore >= 90 ? "A" : percentageScore >= 80 ? "B" : percentageScore >= 70 ? "C" : percentageScore >= 60 ? "D" : "F", submittedAt: now, attemptId, timedOut };
      await db.collection("quizSubmissions").insertOne(submission, options);
      const [stats] = await db.collection("quizSubmissions").aggregate([
        { $match: { quizId: quiz._id } },
        { $group: { _id: null, totalSubmissions: { $sum: 1 }, averageScore: { $avg: "$percentageScore" }, highestScore: { $max: "$percentageScore" }, lowestScore: { $min: "$percentageScore" }, passRate: { $avg: { $cond: [{ $gte: ["$percentageScore", 60] }, 100, 0] } } } },
        { $project: { _id: 0 } },
      ], options).toArray();
      // This shared write serializes simultaneous submissions and activation changes.
      await db.collection("quizzes").updateOne({ _id: quiz._id }, { $set: { stats: { ...stats, lastSubmissionAt: submission.submittedAt }, updatedAt: submission.submittedAt } }, options);
      const result = { message: timedOut ? "Time expired. Your saved answers were submitted." : "Quiz submitted successfully", submission: { submissionId: submission.submissionId, totalScore, maxScore, percentageScore, correctAnswers: submission.correctAnswers, totalQuestions: submission.totalQuestions, grade: submission.grade, timeSpent, submittedAt: submission.submittedAt, showResults: quiz.showResults !== false, answers: quiz.showResults !== false ? graded : null } };
      await db.collection("quizAttempts").updateOne({ _id: attempt._id, attemptId }, { $set: { status: "submitted", result, submittedAt: now } }, options);
      return result;
    });
  } finally { await transaction.endSession(); }
}
