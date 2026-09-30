import { getQuizDb } from "../../../utils/mongodb";
import clientPromise from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { ObjectId } from "mongodb";

// Generate a unique 6-character alphanumeric quiz code
function generateQuizCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = getQuizDb(client);

    if (req.method === "POST") {
      // Create new quiz (Faculty only)
      if (session.user.role !== "faculty" && session.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only faculty can create quizzes" });
      }

      const { quizName, questions, timeLimit = 30 } = req.body;

      if (
        !quizName ||
        !questions ||
        !Array.isArray(questions) ||
        questions.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Quiz name and questions are required" });
      }

      // Validate questions format
      for (const q of questions) {
        if (
          !q.question ||
          !q.options ||
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          typeof q.correctAnswer !== "number"
        ) {
          return res.status(400).json({ message: "Invalid question format" });
        }
      }

      const quizCode = generateQuizCode();

      const quiz = {
        quizName,
        questions,
        timeLimit,
        quizCode,
        createdBy: session.user.id,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
        createdByName: session.user.name,
        createdAt: new Date(),
        isActive: true,
        submissions: [],
      };

      const result = await db.collection("quizzes").insertOne(quiz);

      res.status(201).json({
        message: "Quiz created successfully",
        quizId: result.insertedId,
        quizCode: quizCode,
      });
    } else if (req.method === "GET") {
      // Get quizzes based on role
      if (session.user.role === "faculty" || session.user.role === "admin") {
        // Faculty/Admin: Get their created quizzes
        const quizzes = await db
          .collection("quizzes")
          .find({
            createdBy: { $in: [session.user.id, new ObjectId(session.user.id)] },
            isActive: true,
          })
          .project({
            questions: 0, // Don't send questions in list view
          })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json({ quizzes });
      } else {
        // Students: No access to quiz list
        res.status(403).json({ message: "Students cannot view quiz list" });
      }
    } else if (req.method === "DELETE") {
      // Delete quiz (Faculty only)
      if (session.user.role !== "faculty" && session.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only faculty can delete quizzes" });
      }

      const { quizId } = req.query;

      if (typeof quizId !== "string" || !ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: "Quiz ID is required" });
      }

      const result = await db.collection("quizzes").updateOne(
        {
          _id: new ObjectId(quizId),
          createdBy: { $in: [session.user.id, new ObjectId(session.user.id)] },
        },
        {
          $set: { isActive: false, deletedAt: new Date() },
        },
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ message: "Quiz not found or not authorized" });
      }

      res.status(200).json({ message: "Quiz deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Quiz API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
