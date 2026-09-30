import { getPaginationParams } from "../../../lib/pagination";
import { ObjectId } from "mongodb";
import { getQuizDb } from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      search = "",
      category = "",
      status = "all",
    } = req.query;
    const { page, limit, skip } = getPaginationParams(req);

    const client = await clientPromise;
    const db = getQuizDb(client);

    let query = {};

    // Role-based filtering
    if (session.user.role === "faculty") {
      query.createdBy = { $in: [session.user.id, new ObjectId(session.user.id)] };
    } else {
      // Students don't browse quizzes - they join via code
      // This endpoint is mainly for faculty to manage their quizzes
      return res
        .status(403)
        .json({ message: "Students should join quizzes via code" });
    }

    // Search functionality
    if (search.trim()) {
      query.$or = [
        { quizName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Status filter - for teachers, show all quizzes by default
    if (session.user.role === "faculty") {
      // Teachers see all their quizzes (active and ended) by default
      if (status === "active") {
        query.isActive = true;
      } else if (status === "expired") {
        query.isActive = false;
      }
      // For 'all' status, don't add isActive filter (show both active and ended)
    } else {
      // For students, only show active quizzes unless specifically requesting ended ones
      if (status === "expired") {
        query.isActive = false;
      } else {
        query.isActive = true;
      }
    }

    // Get total count
    const totalQuizzes = await db.collection("quizzes").countDocuments(query);

    // Get quizzes with pagination
    const quizzes = await db
      .collection("quizzes")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .project({
        quizName: 1,
        description: 1,
        category: 1,
        difficulty: 1,
        totalQuestions: 1,
        totalPoints: 1,
        timeLimit: 1,
        allowRetakes: 1,
        showResults: 1,
        isActive: 1,
        createdAt: 1,
        createdByName: 1,
        stats: 1,
        quizCode: 1,
      })
      .toArray();

    // For students, get their submissions to check completion status
    let studentSubmissions = [];
    if (session.user.role === "student") {
      studentSubmissions = await db
        .collection("quizSubmissions")
        .find({
          $or: [
            { userId: session.user.id },
            { userEmail: session.user.email },
            { studentId: session.user.studentId || session.user.email },
          ],
        })
        .toArray();
    }

    // Add computed fields - USE MANUAL CONTROL INSTEAD OF DEADLINE
    const enrichedQuizzes = quizzes.map((quiz) => {
      // Use the isActive field for manual teacher control
      const isActive = quiz.isActive === true;
      const status = isActive ? "active" : "ended";

      // Check if student has submitted this quiz
      const hasSubmitted =
        session.user.role === "student" &&
        studentSubmissions.some(
          (sub) => sub.quizId.toString() === quiz._id.toString(),
        );

      return {
        ...quiz,
        isActive: isActive,
        status: status,
        canTake: isActive && !hasSubmitted, // Students can only take active quizzes they haven't submitted
        hasSubmitted: hasSubmitted,
      };
    });

    res.status(200).json({
      quizzes: enrichedQuizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalQuizzes / parseInt(limit)),
        totalQuizzes,
        hasNextPage: skip + parseInt(limit) < totalQuizzes,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Quiz list error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
