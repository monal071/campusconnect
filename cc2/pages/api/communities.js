import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { cache } from "../../lib/redis";
import { generateUniqueCommunityCode } from "../../lib/communityCode";

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
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id.toString();

    // Check cache
    const cacheKey = `communities:user:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // If admin requested all communities, return them
    let communities = [];
    if (req.query.all === "true" && session.user.role === "admin") {
      communities = await db
        .collection("communities")
        .find({})
        .sort({ updatedAt: -1 })
        .toArray();
    } else {
      // Only fetch communities the user belongs to
      communities = await db
        .collection("communities")
        .find({ members: userId })
        .sort({ updatedAt: -1 })
        .toArray();
    }

    const communitiesWithMeta = communities.map((c) => {
      // Check multiple possible formats for creator matching
      const isCreator =
        c.creatorId === userId ||
        c.creatorId === user.email ||
        c.creator?.id === userId ||
        c.creator?.email === user.email;
      return {
        ...c,
        _id: c._id.toString(),
        memberCount: c.members?.length || 0,
        isCreator,
        isAdmin: c.admins?.includes(userId) || isCreator,
      };
    });

    const response = {
      success: true,
      communities: communitiesWithMeta,
    };

    await cache.set(cacheKey, response, 120);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching communities:", error);
    return res.status(500).json({ message: "Failed to fetch communities" });
  }
}

async function handlePost(req, res, db, session) {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Community name is required" });
    }

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id.toString();
    const code = await generateUniqueCommunityCode(db);

    const community = {
      name: name.trim(),
      description: description?.trim() || "",
      image: image || null,
      code,
      creatorId: userId,
      creator: {
        id: userId,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      members: [userId],
      admins: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("communities").insertOne(community);

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $push: { communities: result.insertedId.toString() },
        $set: { updatedAt: new Date() },
      },
    );

    // Invalidate user's community cache
    await cache.del(`communities:user:${userId}`);

    return res.status(201).json({
      success: true,
      community: { ...community, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error("Error creating community:", error);
    return res.status(500).json({ message: "Failed to create community" });
  }
}
