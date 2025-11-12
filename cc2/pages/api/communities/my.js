import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userCommunityIds = user.communities || [];

    // Fetch all communities where user is a member
    const communities = await db
      .collection("communities")
      .find({ members: user._id.toString() })
      .sort({ updatedAt: -1 })
      .toArray();

    // Add member count and status
    const communitiesWithData = communities.map((community) => ({
      ...community,
      memberCount: community.members?.length || 0,
      joinStatus: "member",
      isCreator: community.creatorId === user._id.toString(),
    }));

    return res.status(200).json({
      success: true,
      communities: communitiesWithData,
    });
  } catch (error) {
    console.error("Error fetching user communities:", error);
    return res.status(500).json({ message: "Failed to fetch communities" });
  }
}
