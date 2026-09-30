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
  const { quizId, answers, timeSpent = 0 } = body;
  if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) throw new ApiError(400, "Invalid quiz ID");
  if (!Array.isArray(answers) || answers.length > 200 || answers.some(a => typeof a !== "string" && typeof a !== "number") || answers.some(a => typeof a === "string" && a.length > 5000)) throw new ApiError(400, "Invalid answers");
  if (!Number.isFinite(timeSpent) || timeSpent < 0) throw new ApiError(400, "Invalid time spent");
  const transaction = client.startSession();
  try {
    return await transaction.withTransaction(async () => {
      const options = { session: transaction };
      const quiz = await db.collection("quizzes").findOne({ _id: new ObjectId(quizId) }, options);
      if (!quiz) throw new ApiError(404, "Quiz not found");
      if (quiz.isActive === false || quiz.deletedAt) throw new ApiError(409, "Quiz is not active");
      if (!quiz.questions?.length || answers.length > quiz.questions.length) throw new ApiError(400, "Answers do not match this quiz");
      const existing = await db.collection("quizSubmissions").findOne({ quizId: quiz._id, $or: [{ userId: user.id }, { userEmail: user.email }] }, options);
      if (!quiz.allowRetakes && existing) throw new ApiError(409, "You have already submitted this quiz");
      const ordered = quizQuestions(quiz, user.id);
      const graded = gradeAnswers({ ...quiz, questions: ordered }, answers);
      const canonicalAnswers = ordered.map((question, index) => ({ originalIndex: question.originalIndex, answer: graded[index] })).sort((a, b) => a.originalIndex - b.originalIndex).map(item => item.answer);
      const totalScore = graded.reduce((sum, a) => sum + a.points, 0);
      const maxScore = graded.reduce((sum, a) => sum + a.maxPoints, 0);
      const percentageScore = Math.round(totalScore / maxScore * 10000) / 100;
      const submission = { _id: new ObjectId(), submissionId: new ObjectId().toString(), quizId: quiz._id, quizName: quiz.quizName, userId: user.id, userEmail: user.email, studentId: user.studentId || user.enrollmentNo || user.email.split("@")[0].toUpperCase(), studentName: user.name, answers: canonicalAnswers, totalScore, maxScore, percentageScore, correctAnswers: graded.filter(a => a.isCorrect).length, totalQuestions: graded.length, timeSpent, grade: percentageScore >= 90 ? "A" : percentageScore >= 80 ? "B" : percentageScore >= 70 ? "C" : percentageScore >= 60 ? "D" : "F", submittedAt: new Date() };
      await db.collection("quizSubmissions").insertOne(submission, options);
      const [stats] = await db.collection("quizSubmissions").aggregate([
        { $match: { quizId: quiz._id } },
        { $group: { _id: null, totalSubmissions: { $sum: 1 }, averageScore: { $avg: "$percentageScore" }, highestScore: { $max: "$percentageScore" }, lowestScore: { $min: "$percentageScore" }, passRate: { $avg: { $cond: [{ $gte: ["$percentageScore", 60] }, 100, 0] } } } },
        { $project: { _id: 0 } },
      ], options).toArray();
      // This shared write serializes simultaneous submissions and activation changes.
      await db.collection("quizzes").updateOne({ _id: quiz._id }, { $set: { stats: { ...stats, lastSubmissionAt: submission.submittedAt }, updatedAt: submission.submittedAt } }, options);
      return { message: "Quiz submitted successfully", submission: { submissionId: submission.submissionId, totalScore, maxScore, percentageScore, correctAnswers: submission.correctAnswers, totalQuestions: submission.totalQuestions, grade: submission.grade, timeSpent, submittedAt: submission.submittedAt, showResults: quiz.showResults !== false, answers: quiz.showResults !== false ? graded : null } };
    });
  } finally { await transaction.endSession(); }
}
