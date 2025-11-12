import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { ObjectId } from "mongodb";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    switch (req.method) {
      case "GET":
        return await handleGet(req, res, db, session);
      case "POST":
        return await handlePost(req, res, db, session);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Communities API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleGet(req, res, db, session) {
  try {
    // Get all communities with member count
    const communities = await db
      .collection("communities")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Get user's memberships and pending requests
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });
    const userMemberCommunities = user?.communities || [];
    const userPendingRequests = user?.pendingCommunityRequests || [];

    // Add join status and member count for each community
    const communitiesWithStatus = communities.map((community) => ({
      ...community,
      memberCount: community.members?.length || 0,
      joinStatus: userMemberCommunities.includes(community._id.toString())
        ? "member"
        : userPendingRequests.includes(community._id.toString())
        ? "pending"
        : "none",
      isCreator: community.creatorId === user?._id?.toString(),
    }));

    return res.status(200).json({
      success: true,
      communities: communitiesWithStatus,
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return res.status(500).json({ message: "Failed to fetch communities" });
  }
}

async function handlePost(req, res, db, session) {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Community name is required" });
    }

    // Get user info
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create community
    const community = {
      name: name.trim(),
      description: description?.trim() || "",
      isPrivate: !!isPrivate,
      creatorId: user._id.toString(),
      creator: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      },
      members: [user._id.toString()],
      pendingRequests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("communities").insertOne(community);

    // Add community to user's communities list
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $push: { communities: result.insertedId.toString() },
        $set: { updatedAt: new Date() },
      }
    );

    return res.status(201).json({
      success: true,
      community: { ...community, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating community:", error);
    return res.status(500).json({ message: "Failed to create community" });
  }
}
