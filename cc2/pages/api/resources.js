import clientPromise from "../../utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { invalidateCache } from "../../lib/redis";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description too long"),
  type: z.string().min(1, "Type is required"),
  category: z.string().optional(),
  url: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith("/") || URL.canParse(val), {
      message: "Invalid URL format",
    }),
  downloadUrl: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  fileSize: z.number().optional(),
  fileName: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db();

      // Get query parameters for pagination, filtering, and sorting
      const {
        limit,
        sort,
        page = 1,
        type,
        search,
        category,
        tags,
        authorRole,
      } = req.query;

      const limitNum = parseInt(limit) || 20;
      const pageNum = parseInt(page) || 1;
      const skipNum = (pageNum - 1) * limitNum;

      // Build filter query
      let filterQuery = {};

      // Filter by type
      if (type && type !== "all") {
        filterQuery.type = type;
      }

      // Filter by category
      if (category && category !== "all") {
        filterQuery.category = category;
      }

      // Filter by author role (faculty/student)
      if (authorRole && authorRole !== "all") {
        filterQuery.authorRole = authorRole;
      }

      // Search functionality
      if (search) {
        filterQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      // Filter by tags
      if (tags) {
        const tagArray = tags.split(",").map((tag) => tag.trim());
        filterQuery.tags = { $in: tagArray };
      }

      // Build sort query
      let sortQuery = { createdAt: -1 }; // Default: newest first

      if (sort === "popular") {
        sortQuery = { likes: -1, createdAt: -1 };
      } else if (sort === "oldest") {
        sortQuery = { createdAt: 1 };
      } else if (sort === "title") {
        sortQuery = { title: 1 };
      } else if (sort === "updated") {
        sortQuery = { updatedAt: -1 };
      }

      // Get total count for pagination
      const totalCount = await db
        .collection("resources")
        .countDocuments(filterQuery);

      const resources = await db
        .collection("resources")
        .find(filterQuery)
        .sort(sortQuery)
        .skip(skipNum)
        .limit(limitNum)
        .toArray();

      // Add user details for each resource
      const resourcesWithUsers = await Promise.all(
        resources.map(async (resource) => {
          if (resource.userId) {
            try {
              const user = await db
                .collection("users")
                .findOne(
                  { _id: new ObjectId(resource.userId) },
                  { projection: { name: 1, email: 1, image: 1, role: 1 } },
                );
              return {
                ...resource,
                author: user?.name || "Unknown User",
                authorEmail: user?.email || "",
                authorImage: user?.image || null,
                authorRole: user?.role || "student",
              };
            } catch (error) {
              return {
                ...resource,
                author: "Unknown User",
                authorEmail: "",
                authorImage: null,
                authorRole: "student",
              };
            }
          }
          return {
            ...resource,
            author: resource.author || "Unknown User",
            authorEmail: "",
            authorImage: null,
            authorRole: "student",
          };
        }),
      );

      res.status(200).json({
        data: resourcesWithUsers,
        total: totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: pageNum * limitNum < totalCount,
      });
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  } else if (req.method === "POST") {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const client = await clientPromise;
      const db = client.db();

      // Get user details - try multiple methods to find user
      let user = await db.collection("users").findOne({
        email: session.user.email.toLowerCase(),
      });

      // If not found by email, try by ID
      if (!user && session.user.id) {
        user = await db.collection("users").findOne({
          _id: new ObjectId(session.user.id),
        });
      }

      // If still not found, try by email without lowercase
      if (!user) {
        user = await db.collection("users").findOne({
          email: session.user.email,
        });
      }

      if (!user) {
        console.error("User not found:", session.user.email);
        return res.status(404).json({ error: "User not found" });
      }

      // Validate request body with Zod
      const parse = resourceSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          error: "Validation failed",
          message: parse.error.errors[0].message,
          details: parse.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      const { title, description, type, category, url, downloadUrl, tags, fileSize, fileName, isPublic } = parse.data;

      // Validate downloadUrl if provided (but allow relative paths for uploaded files)
      if (downloadUrl && !downloadUrl.startsWith("/")) {
        try {
          new URL(downloadUrl);
        } catch {
          return res.status(400).json({ error: "Invalid download URL format" });
        }
      }

      const resource = {
        title: title.trim(),
        description: description.trim(),
        type,
        category: category || "general",
        url: url || null,
        downloadUrl: downloadUrl || null,
        tags: Array.isArray(tags)
          ? tags
          : tags
            ? tags.split(",").map((t) => t.trim())
            : [],
        fileSize: fileSize || null,
        fileName: fileName || null,
        isPublic,
        isVerified: user.role === "faculty", // Auto-verify if posted by faculty
        verifiedBy: user.role === "faculty" ? user._id : null,
        verifiedAt: user.role === "faculty" ? new Date() : null,
        likes: 0,
        likedBy: [],
        downloads: 0,
        views: 0,
        userId: new ObjectId(user._id), // Ensure ObjectId
        author: user.name || user.email?.split("@")[0] || "Unknown User",
        authorEmail: user.email,
        authorImage: user.image || null,
        authorRole: user.role || "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(
        "Creating resource with author:",
        resource.author,
        "userId:",
        resource.userId,
      );

      const result = await db.collection("resources").insertOne(resource);

      // Return the created resource with user info
      const createdResource = {
        ...resource,
        _id: result.insertedId,
        authorImage: user.image || null,
      };

      // Record user activity for adding a resource
      try {
        await db.collection("userActivity").insertOne({
          userId: user._id.toString(),
          type: "resource_add",
          content: `Added resource: ${resource.title}`,
          resourceId: result.insertedId,
          timestamp: new Date(),
          icon: "MenuBookIcon",
        });
      } catch (err) {
        console.error("Failed to insert resource activity:", err);
      }

      // Invalidate resources cache so lists update immediately
      try {
        if (
          invalidateCache &&
          typeof invalidateCache.resources === "function"
        ) {
          await invalidateCache.resources();
        }
      } catch (err) {
        console.error("Failed to invalidate resources cache:", err);
      }

      res.status(201).json({
        message: "Resource added successfully",
        data: createdResource,
      });
    } catch (error) {
      console.error("Error adding resource:", error);
      res.status(500).json({ error: "Failed to add resource" });
    }
  } else if (req.method === "PUT") {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { resourceId, ...updateData } = req.body;

      if (!resourceId) {
        return res.status(400).json({ error: "Resource ID is required" });
      }

      const client = await clientPromise;
      const db = client.db();

      // Check if resource exists and user owns it
      const resource = await db.collection("resources").findOne({
        _id: new ObjectId(resourceId),
      });

      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      const user = await db.collection("users").findOne({
        email: session.user.email.toLowerCase(),
      });

      // Check ownership or admin role
      if (
        resource.userId.toString() !== user._id.toString() &&
        user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Permission denied" });
      }

      // Update resource
      const updatedResource = {
        ...updateData,
        updatedAt: new Date(),
      };

      await db
        .collection("resources")
        .updateOne(
          { _id: new ObjectId(resourceId) },
          { $set: updatedResource },
        );

      res.status(200).json({
        message: "Resource updated successfully",
        data: { ...resource, ...updatedResource },
      });
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ error: "Failed to update resource" });
    }
  } else if (req.method === "DELETE") {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { resourceId } = req.body;

      if (!resourceId) {
        return res.status(400).json({ error: "Resource ID is required" });
      }

      const client = await clientPromise;
      const db = client.db();

      // Check if resource exists and user owns it
      const resource = await db.collection("resources").findOne({
        _id: new ObjectId(resourceId),
      });

      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      const user = await db.collection("users").findOne({
        email: session.user.email.toLowerCase(),
      });

      // Check ownership, faculty role, or admin role
      if (
        resource.userId.toString() !== user._id.toString() &&
        user.role !== "admin" &&
        user.role !== "faculty"
      ) {
        return res.status(403).json({ error: "Permission denied" });
      }

      // Delete resource
      await db.collection("resources").deleteOne({
        _id: new ObjectId(resourceId),
      });

      res.status(200).json({
        message: "Resource deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  } else if (req.method === "PATCH") {
    try {
      // Check authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { resourceId, action } = req.body;

      if (!resourceId) {
        return res.status(400).json({ error: "Resource ID is required" });
      }

      const client = await clientPromise;
      const db = client.db();

      const user = await db.collection("users").findOne({
        email: session.user.email.toLowerCase(),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Handle verify action - only faculty can verify
      if (action === "verify") {
        if (user.role !== "faculty") {
          return res
            .status(403)
            .json({ error: "Only faculty can verify resources" });
        }

        const resource = await db.collection("resources").findOne({
          _id: new ObjectId(resourceId),
        });

        if (!resource) {
          return res.status(404).json({ error: "Resource not found" });
        }

        // Update resource to verified
        await db.collection("resources").updateOne(
          { _id: new ObjectId(resourceId) },
          {
            $set: {
              isVerified: true,
              verifiedBy: user._id,
              verifiedAt: new Date(),
              updatedAt: new Date(),
            },
          },
        );

        return res.status(200).json({
          message: "Resource verified successfully",
          isVerified: true,
        });
      }

      return res.status(400).json({ error: "Invalid action" });
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ error: "Failed to update resource" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
