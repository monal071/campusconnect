import { connectToDatabase } from "../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      // Get all collections (user's own or public)
      const { userId, tags } = req.query;

      const query = {
        $or: [{ userId: session.user.id }, { isPublic: true }],
      };

      if (userId) {
        query.userId = userId;
      }

      if (tags) {
        query.tags = { $in: tags.split(",") };
      }

      const collections = await db
        .collection("resourceCollections")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      // Get resource details for each collection
      const collectionsWithDetails = await Promise.all(
        collections.map(async (collection) => {
          const resourceIds =
            collection.resources?.map((r) => r.resourceId) || [];
          const resources = await db
            .collection("resources")
            .find({ _id: { $in: resourceIds } })
            .project({ title: 1, type: 1 })
            .toArray();

          // Get creator info
          const creator = await db
            .collection("users")
            .findOne({ _id: collection.userId })
            .project({ name: 1, image: 1 });

          return {
            ...collection,
            resourceCount: resourceIds.length,
            resourceDetails: resources,
            creator,
          };
        })
      );

      return res.status(200).json({
        collections: collectionsWithDetails,
        count: collectionsWithDetails.length,
      });
    }

    if (req.method === "POST") {
      // Create new collection
      const {
        name,
        description,
        resources = [],
        tags = [],
        isPublic = false,
      } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: "Collection name is required" });
      }

      const newCollection = {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || "",
        resources: resources.map((r, index) => ({
          resourceId: r.resourceId || r,
          order: r.order !== undefined ? r.order : index,
          addedAt: new Date(),
        })),
        tags: Array.isArray(tags) ? tags : [],
        isPublic,
        views: 0,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .collection("resourceCollections")
        .insertOne(newCollection);

      return res.status(201).json({
        success: true,
        collection: {
          ...newCollection,
          _id: result.insertedId,
        },
      });
    }

    if (req.method === "PUT") {
      // Update collection
      const { collectionId, name, description, resources, tags, isPublic } =
        req.body;

      if (!collectionId) {
        return res.status(400).json({ error: "Collection ID is required" });
      }

      // Verify ownership
      const collection = await db.collection("resourceCollections").findOne({
        _id: collectionId,
        userId: session.user.id,
      });

      if (!collection) {
        return res
          .status(404)
          .json({ error: "Collection not found or unauthorized" });
      }

      const updates = {
        updatedAt: new Date(),
      };

      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description.trim();
      if (resources !== undefined) {
        updates.resources = resources.map((r, index) => ({
          resourceId: r.resourceId || r,
          order: r.order !== undefined ? r.order : index,
          addedAt: r.addedAt || new Date(),
        }));
      }
      if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
      if (isPublic !== undefined) updates.isPublic = isPublic;

      await db
        .collection("resourceCollections")
        .updateOne({ _id: collectionId }, { $set: updates });

      return res.status(200).json({
        success: true,
        collection: {
          ...collection,
          ...updates,
        },
      });
    }

    if (req.method === "DELETE") {
      // Delete collection
      const { collectionId } = req.query;

      if (!collectionId) {
        return res.status(400).json({ error: "Collection ID is required" });
      }

      // Verify ownership
      const result = await db.collection("resourceCollections").deleteOne({
        _id: collectionId,
        userId: session.user.id,
      });

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ error: "Collection not found or unauthorized" });
      }

      return res.status(200).json({
        success: true,
        message: "Collection deleted",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Collections API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
