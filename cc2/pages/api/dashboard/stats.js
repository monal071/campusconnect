import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    // Create ObjectId from string ID
    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Compute connections count from the connections collection
    // (connections are stored in `connections` with user1Id/user2Id fields)
    let connectionsCount = 0;
    try {
      const userEmail = session.user.email;
      connectionsCount = await db.collection("connections").countDocuments({
        $or: [{ user1Id: userEmail }, { user2Id: userEmail }],
      });
    } catch (err) {
      console.error("Error counting connections:", err);
      connectionsCount = 0;
    }

    // Get posts count (Posts collection used by posts API)
    const postsCount = await db.collection("Posts").countDocuments({
      "author.id": userId,
    });

    // Get events count that the user has created (events collection)
    const eventsCount = await db.collection("events").countDocuments({
      createdBy: userId,
    });

    // Get resources count (that the user has shared) - resources.userId is stored as ObjectId
    let resourcesCount = 0;
    try {
      resourcesCount = await db.collection("resources").countDocuments({
        userId: new ObjectId(userId),
      });
    } catch (err) {
      // Fallback: try string match
      resourcesCount = await db.collection("resources").countDocuments({
        userId: userId,
      });
    }

    // Get jobs count (that the user has posted) - jobs collection is lowercase
    const jobsCount = await db.collection("jobs").countDocuments({
      $or: [{ createdBy: userId }, { postedBy: userId }],
    });

    // Get quiz statistics based on user role
    let quizStats = {
      totalQuizzes: 0,
      activeQuizzes: 0,
      submissions: 0,
      averageScore: 0,
    };

    if (session.user.role === "faculty" || session.user.role === "admin") {
      // Teacher stats: quizzes they created (no submission/score stats for faculty)
      const teacherEmail = session.user.email;

      const totalQuizzes = await db.collection("quizzes").countDocuments({
        createdBy: teacherEmail,
      });

      const activeQuizzes = await db.collection("quizzes").countDocuments({
        createdBy: teacherEmail,
        isActive: true,
      });

      quizStats = {
        totalQuizzes,
        activeQuizzes,
        submissions: 0, // Remove submission stats for faculty
        averageScore: 0, // Remove average score for faculty
      };
    } else if (session.user.role === "student") {
      // Student stats: No quiz stats displayed for students
      quizStats = {
        totalQuizzes: 0,
        activeQuizzes: 0,
        submissions: 0,
        averageScore: 0,
      };
    }

    // Return the stats
    console.log("Dashboard stats being returned:", {
      connections: connectionsCount,
      posts: postsCount,
      events: eventsCount,
      resources: resourcesCount,
      jobs: jobsCount,
      quizzes: quizStats,
    });

    return res.status(200).json({
      message: "Stats retrieved successfully",
      data: {
        connections: connectionsCount,
        posts: postsCount,
        events: eventsCount,
        resources: resourcesCount,
        jobs: jobsCount,
        quizzes: quizStats,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
}
