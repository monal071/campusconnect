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

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const community = await db
      .collection("communities")
      .findOne({ _id: new ObjectId(id) });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const userId = user._id.toString();
    const isMember = community.members?.includes(userId);
    const isCreator = community.creatorId === userId;
    const isAdmin = community.admins?.includes(userId) || isCreator;

    // Only members can view community details
    if (!isMember) {
      return res.status(403).json({
        message: "You must be a member to view this community",
      });
    }

    return res.status(200).json({
      success: true,
      community: {
        ...community,
        _id: community._id.toString(),
        memberCount: community.members?.length || 0,
        isMember: true,
        isCreator,
        isAdmin,
        code: community.code,
      },
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    return res.status(500).json({ message: "Failed to fetch community" });
  }
}
