import {
  addItem,
  getAllItems,
  updateItem,
  deleteItem,
  getItem,
  DatabaseError,
} from "../../utils/db";
import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import type { ApiResponse, Post } from "../../types/api";
import { withRateLimit } from "../../lib/rateLimiter";

const TABLE_NAME = "Posts";

// Configure API route to handle larger payloads (for images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

// Zod schema for post validation
const postSchema = z
  .object({
    content: z
      .string()
      .min(1, "Content cannot be empty")
      .max(1000, "Content must be less than 1000 characters")
      .optional(),
    author: z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Author name is required"),
      image: z.string().optional(),
    }),
    images: z.array(z.string()).max(4, "Maximum 4 images allowed").optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => data.content || (data.images && data.images.length > 0), {
    message: "Post must have either content or at least one image",
  });

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters"),
  author: z.object({
    id: z.string(),
    name: z.string().min(1, "Author name is required"),
    image: z.string().optional(),
  }),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res);
      case "POST":
        // Rate-limit post creation: max 10 posts per 15 minutes per IP
        return await withRateLimit(handlePost, "api")(req, res);
      case "PUT":
        return await handlePut(req, res);
      case "DELETE":
        return await handleDelete(req, res);
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).json({
          success: false,
          error: `Method ${req.method} Not Allowed`,
        });
    }
  } catch (error) {
    console.error("Error in posts API:", error);
    if (
      error.message &&
      error.message.includes("Failed to connect to MongoDB")
    ) {
      return res.status(503).json({
        success: false,
        error: "Database unavailable",
        message: "Cannot connect to database. Please try again later.",
      });
    }
    if (error instanceof DatabaseError) {
      return res.status(500).json({
        success: false,
        error: "Database operation failed",
        message: error.message,
      });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: error.errors[0].message,
      });
    }
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { page = "1", limit = "10", userId } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const options = {
    limit: limitNum,
    ...(userId && {
      filterExpression: "author.id = :userId",
      expressionValues: { ":userId": userId },
    }),
  };

  const result = await getAllItems(TABLE_NAME, options);

  return res.status(200).json({
    success: true,
    data: result.data, // FIX: use result.data instead of result.items
    page: pageNum,
    pageSize: limitNum,
    hasMore: result.hasMore,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const parse = postSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid post data",
      message: parse.error.errors[0].message,
    });
  }

  const post: Post = {
    ...parse.data,
    content: parse.data.content || "",
    id: `post_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: [],
    comments: [],
    images: parse.data.images || [],
  };

  const result = await addItem(TABLE_NAME, post);
  return res.status(201).json({ success: true, data: post });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({
      success: false,
      error: "Post ID is required",
    });
  }

  const { action } = req.body;
  if (action === "like") {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required for liking a post",
      });
    }

    const postResult = await getItem(TABLE_NAME, id);
    const post = postResult.data as Post;
    const likes = new Set(post.likes || []);

    if (likes.has(userId)) {
      likes.delete(userId);
    } else {
      likes.add(userId);
    }

    await updateItem(TABLE_NAME, { id }, { likes: Array.from(likes) });
    return res.status(200).json({
      success: true,
      data: { likes: Array.from(likes) },
    });
  }

  if (action === "comment") {
    const parse = commentSchema.safeParse(req.body.comment);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid comment data",
        message: parse.error.errors[0].message,
      });
    }

    const postResult = await getItem(TABLE_NAME, id);
    const post = postResult.data as Post;
    const comment = {
      ...parse.data,
      id: `comment_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const comments = [...(post.comments || []), comment];
    await updateItem(TABLE_NAME, { id }, { comments });
    return res.status(200).json({
      success: true,
      data: { comments },
    });
  }

  return res.status(400).json({
    success: false,
    error: "Invalid action",
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  let id = req.body.id || req.query.id;
  if (!id || typeof id !== "string") {
    return res.status(400).json({
      success: false,
      error: "Post ID is required",
    });
  }
  await deleteItem(TABLE_NAME, id);
  return res.status(200).json({
    success: true,
    message: "Post deleted successfully",
  });
}
