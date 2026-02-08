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

    // Get current user to count their friends
    const currentUser = await db.collection("users").findOne({
      _id: objectId,
    });

    // Get connections count from user's friends array with validation
    let connectionsCount = 0;
    if (currentUser?.friends && Array.isArray(currentUser.friends)) {
      // Filter out any invalid entries and remove duplicates
      const validFriendIds = [
        ...new Set(
          currentUser.friends.filter(
            (friendId) => friendId && friendId.toString().length === 24, // Valid ObjectId length
          ),
        ),
      ];

      // Verify these friends actually exist in the database
      const existingFriends = await db.collection("users").countDocuments({
        _id: {
          $in: validFriendIds
            .map((id) => {
              try {
                return new ObjectId(id);
              } catch {
                return null;
              }
            })
            .filter(Boolean),
        },
      });

      connectionsCount = existingFriends;
    }

    // Get events count that the user has joined
    const eventsCount = await db.collection("events").countDocuments({
      joined: userId,
    });

    // Get resources count (that the user has shared)
    const resourcesCount = await db.collection("resources").countDocuments({
      userId: userId,
    });

    // Get jobs count (that the user has posted)
    const jobsCount = await db.collection("Jobs").countDocuments({
      postedBy: userId,
    });

    // Get bookmarks count for the user
    const bookmarksCount = await db.collection("bookmarks").countDocuments({
      userId: objectId,
    });

    // Get events the user has joined (3 most recent, prefer upcoming)
    const joinedEvents = await db
      .collection("events")
      .find({ joined: userId })
      .sort({ date: -1 })
      .limit(5)
      .project({ title: 1, description: 1, date: 1, location: 1, joined: 1 })
      .toArray();

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
      // Student stats: quiz submission count and average score
      const studentEmail = session.user.email;
      const studentId = userId;

      const submissions = await db
        .collection("quizSubmissions")
        .find({
          $or: [{ userId: studentId }, { userEmail: studentEmail }],
        })
        .toArray();

      const totalSubmissions = submissions.length;
      const averageScore =
        totalSubmissions > 0
          ? parseFloat(
              (
                submissions.reduce(
                  (sum, s) => sum + (s.percentageScore || 0),
                  0,
                ) / totalSubmissions
              ).toFixed(1),
            )
          : 0;

      quizStats = {
        totalQuizzes: 0,
        activeQuizzes: 0,
        submissions: totalSubmissions,
        averageScore: averageScore,
      };
    }

    // Return the stats
    return res.status(200).json({
      message: "Stats retrieved successfully",
      data: {
        connections: connectionsCount,
        events: eventsCount,
        resources: resourcesCount,
        jobs: jobsCount,
        bookmarks: bookmarksCount,
        joinedEvents: joinedEvents,
        quizzes: quizStats,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
}
