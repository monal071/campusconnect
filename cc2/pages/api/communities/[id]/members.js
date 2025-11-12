import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
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

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You must be a member to view members" });
    }

    // Fetch member details
    const memberIds = community.members || [];
    const members = await db
      .collection("users")
      .find({ _id: { $in: memberIds.map((id) => new ObjectId(id)) } })
      .project({ name: 1, email: 1, image: 1, title: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      members: members.map((member) => ({
        ...member,
        isCreator: member._id.toString() === community.creatorId,
      })),
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ message: "Failed to fetch members" });
  }
}
