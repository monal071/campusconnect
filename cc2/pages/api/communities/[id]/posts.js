import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
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
        .json({ message: "You must be a member to access posts" });
    }

    switch (req.method) {
      case "GET":
        return await handleGet(req, res, db, id);
      case "POST":
        return await handlePost(req, res, db, id, user);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Community posts API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleGet(req, res, db, communityId) {
  try {
    const posts = await db
      .collection("communityPosts")
      .find({ communityId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Failed to fetch posts" });
  }
}

async function handlePost(req, res, db, communityId, user) {
  try {
    const { content, images } = req.body;

    if (!content && (!images || images.length === 0)) {
      return res
        .status(400)
        .json({ message: "Post must have content or images" });
    }

    if (images && images.length > 4) {
      return res.status(400).json({ message: "Maximum 4 images allowed" });
    }

    const post = {
      communityId,
      content: content?.trim() || "",
      images: images || [],
      author: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      },
      likes: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("communityPosts").insertOne(post);

    // Update community's last activity
    await db
      .collection("communities")
      .updateOne(
        { _id: new ObjectId(communityId) },
        { $set: { updatedAt: new Date() } }
      );

    return res.status(201).json({
      success: true,
      post: { ...post, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ message: "Failed to create post" });
  }
}
