import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.query;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid community ID" });
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

    // Get community
    const community = await db
      .collection("communities")
      .findOne({ _id: new ObjectId(id) });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is a member
    const isMember = community.members?.includes(user._id.toString());
    const isPending = community.pendingRequests?.includes(user._id.toString());
    const isCreator =
      community.createdBy === user._id.toString() ||
      community.creatorId === user._id.toString();

    // If private and not a member, deny access
    if (community.isPrivate && !isMember) {
      return res.status(403).json({
        message: "This is a private community",
        joinStatus: isPending ? "pending" : "none",
      });
    }

    return res.status(200).json({
      success: true,
      community: {
        ...community,
        memberCount: community.members?.length || 0,
        isMember,
        isCreator,
        joinStatus: isMember ? "member" : isPending ? "pending" : "none",
      },
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    return res.status(500).json({ message: "Failed to fetch community" });
  }
}
