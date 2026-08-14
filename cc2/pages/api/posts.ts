import { connectToDatabase } from "../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { ObjectId } from "mongodb";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const COLLECTION = "posts";

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res);
      case "POST":
        return await handlePost(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
        return await handleDelete(req, res);
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Posts API error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
}

async function handleGet(req, res) {
  const { page = "1", limit = "10", userId } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const { db } = await connectToDatabase();
  const filter = userId ? { "author.id": userId } : {};

  const [posts, total] = await Promise.all([
    db.collection(COLLECTION)
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .toArray(),
    db.collection(COLLECTION).countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: posts,
    page: pageNum,
    pageSize: limitNum,
    total,
    hasMore: pageNum * limitNum < total,
  });
}

async function handlePost(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { content, images, tags } = req.body;
  if (!content && (!images || images.length === 0)) {
    return res.status(400).json({ error: "Post must have content or at least one image" });
  }

  const { db } = await connectToDatabase();
  const post = {
    content: content || "",
    images: images || [],
    tags: tags || [],
    author: {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
    },
    likes: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection(COLLECTION).insertOne(post);
  return res.status(201).json({ success: true, data: { ...post, _id: result.insertedId } });
}

async function handlePut(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Post ID is required" });
  }

  const { db } = await connectToDatabase();
  const { action } = req.body;

  if (action === "like") {
    const post = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const likes = new Set(post.likes || []);
    const userId = session.user.id;
    if (likes.has(userId)) {
      likes.delete(userId);
    } else {
      likes.add(userId);
    }
    const likesArray = Array.from(likes);
    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: { likes: likesArray, updatedAt: new Date() } }
    );
    return res.status(200).json({ success: true, data: { likes: likesArray } });
  }

  if (action === "comment") {
    const { content, author } = req.body.comment || {};
    if (!content) return res.status(400).json({ error: "Comment content is required" });

    const comment = {
      id: new ObjectId().toString(),
      content,
      author: author || { id: session.user.id, name: session.user.name, image: session.user.image },
      createdAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment }, $set: { updatedAt: new Date() } }
    );
    const updated = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    return res.status(200).json({ success: true, data: { comments: updated.comments } });
  }

  return res.status(400).json({ error: "Invalid action" });
}

async function handleDelete(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.body?.id || req.query?.id;
  if (!id) return res.status(400).json({ error: "Post ID is required" });

  const { db } = await connectToDatabase();
  const post = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!post) return res.status(404).json({ error: "Post not found" });

  // Only author or admin can delete
  if (post.author?.id !== session.user.id && session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return res.status(200).json({ success: true, message: "Post deleted" });
}
