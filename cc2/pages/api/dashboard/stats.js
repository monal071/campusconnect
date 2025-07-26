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
      _id: objectId 
    });

    // Get connections count from user's friends array with validation
    let connectionsCount = 0;
    if (currentUser?.friends && Array.isArray(currentUser.friends)) {
      // Filter out any invalid entries and remove duplicates
      const validFriendIds = [...new Set(currentUser.friends.filter(friendId => 
        friendId && friendId.toString().length === 24 // Valid ObjectId length
      ))];
      
      // Verify these friends actually exist in the database
      const existingFriends = await db.collection("users").countDocuments({
        _id: { $in: validFriendIds.map(id => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        }).filter(Boolean) }
      });
      
      connectionsCount = existingFriends;
    }

    // Get posts count
    const postsCount = await db.collection("Posts").countDocuments({
      "author.id": userId
    });

    // Get events count that the user has created
    const eventsCount = await db.collection("Events").countDocuments({
      createdBy: userId
    });

    // Get resources count (that the user has shared)
    const resourcesCount = await db.collection("resources").countDocuments({
      userId: userId
    });

    // Get jobs count (that the user has posted)
    const jobsCount = await db.collection("Jobs").countDocuments({
      postedBy: userId
    });

    // Return the stats
    return res.status(200).json({
      message: "Stats retrieved successfully",
      data: {
        connections: connectionsCount,
        posts: postsCount,
        events: eventsCount,
        resources: resourcesCount,
        jobs: jobsCount
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
}
