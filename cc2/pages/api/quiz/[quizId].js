import { studentQuestions } from "../../../lib/quiz-questions";
import { getQuizDb } from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {

      return res.status(401).json({ message: "Authentication required" });
    }

    const { quizId } = req.query;

    if (!quizId || !ObjectId.isValid(quizId)) {

      return res.status(400).json({ message: "Valid quiz ID is required" });
    }

    const client = await clientPromise;
    const db = getQuizDb(client);

    if (req.method === "GET") {

      // Handle GET request for both faculty and students
      let quiz;

      if (session.user.role === "faculty") {

        // Faculty can only access their own quizzes for editing
        quiz = await db.collection("quizzes").findOne({
          _id: new ObjectId(quizId),
          $or: [
            { createdBy: session.user.id }, // string format
            { createdBy: new ObjectId(session.user.id) }, // ObjectId format
          ],
        });
      } else if (session.user.role === "student") {

        // Students can access any quiz for taking
        quiz = await db
          .collection("quizzes")
          .findOne({ _id: new ObjectId(quizId) });

      }

      if (!quiz) {

        return res
          .status(404)
          .json({ message: "Quiz not found or access denied" });
      }

      // Check if quiz is active (manual teacher control)
      if (session.user.role === "student" && quiz.isActive === false) {

        return res.status(400).json({ message: "Quiz is not active" });
      }

      // Return appropriate data based on role
      const responseData = {
        _id: quiz._id,
        quizName: quiz.quizName,
        description: quiz.description,
        questions: session.user.role === "student" ? studentQuestions(quiz, session.user.id) : quiz.questions,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints,
        timeLimit: quiz.timeLimit,
        isActive: quiz.isActive,
        allowRetakes: quiz.allowRetakes,
        showResults: quiz.showResults,
        category: quiz.category,
        difficulty: quiz.difficulty,
        quizCode: quiz.quizCode,
      };

      // Include additional fields for faculty
      if (session.user.role === "faculty") {
        responseData.createdAt = quiz.createdAt;
        responseData.updatedAt = quiz.updatedAt;
        responseData.submissions = await db.collection("quizSubmissions").find({ quizId: quiz._id }).project({ studentId: 1, studentName: 1, totalScore: 1, percentageScore: 1, submittedAt: 1, grade: 1 }).toArray();
        responseData.stats = quiz.stats;
      }

      return res.status(200).json(responseData);
    }

    // For non-GET requests, require faculty access
    if (session.user.role !== "faculty") {
      return res
        .status(403)
        .json({ message: "Forbidden: Faculty access required" });
    }

    // Verify quiz ownership for faculty operations

    // Try to find quiz with both string and ObjectId createdBy formats
    const quiz = await db.collection("quizzes").findOne({
      _id: new ObjectId(quizId),
      $or: [
        { createdBy: session.user.id }, // string format
        { createdBy: new ObjectId(session.user.id) }, // ObjectId format
      ],
    });

    if (!quiz) {
      return res
        .status(404)
        .json({ message: "Quiz not found or access denied" });
    }

    if (req.method === "PUT") {
      const {
        quizName,
        description,
        questions,
        deadline,
        timeLimit,
        category,
        difficulty,
        allowRetakes,
        showResults,
      } = req.body;

      // Validation
      if (!quizName?.trim()) {
        return res.status(400).json({ message: "Quiz name is required" });
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one question is required" });
      }

      // No deadline validation needed - using manual teacher control instead

      // Check if quiz has submissions - restrict certain updates
      const hasSubmissions = Boolean(await db.collection("quizSubmissions").findOne({ quizId: quiz._id }, { projection: { _id: 1 } }));

      const updateData = {
        quizName: quizName.trim(),
        description: description?.trim() || "",
        timeLimit: timeLimit || 60,
        category: category || "general",
        difficulty: difficulty || "medium",
        allowRetakes: allowRetakes || false,
        showResults: showResults !== false,
        updatedAt: new Date(),
      };

      // Only allow question updates if no submissions exist
      if (!hasSubmissions) {
        updateData.questions = questions.map((q, index) => ({
          id: index + 1,
          question: q.question.trim(),
          type: q.type || "multiple-choice",
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? "",
          points: q.points || 1,
          explanation: q.explanation || "",
        }));
        updateData.totalPoints = questions.reduce(
          (sum, q) => sum + (q.points || 1),
          0,
        );
        updateData.totalQuestions = questions.length;
      }

      const result = await db
        .collection("quizzes")
        .updateOne({ _id: new ObjectId(quizId) }, { $set: updateData });

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.status(200).json({
        message: "Quiz updated successfully",
        restrictedUpdate: hasSubmissions
          ? "Questions cannot be modified after submissions"
          : null,
      });
    } else if (req.method === "DELETE") {
      // Faculty who owns the quiz can delete it
      // Allow deletion if quiz is inactive, regardless of submissions
      // Or if quiz has no submissions

      const hasSubmissions = Boolean(await db.collection("quizSubmissions").findOne({ quizId: quiz._id }, { projection: { _id: 1 } }));
      const isInactive = quiz.isActive === false;

      // Block deletion only if quiz has submissions AND is still active
      if (hasSubmissions && !isInactive) {
        return res.status(400).json({
          message:
            "Cannot delete active quiz with existing submissions. Make it inactive first, then you can delete it.",
        });
      }

      const result = await db.collection("quizzes").deleteOne({
        _id: new ObjectId(quizId),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.status(200).json({ message: "Quiz deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Quiz management error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
