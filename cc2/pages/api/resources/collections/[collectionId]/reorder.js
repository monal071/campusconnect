import { connectToDatabase } from "../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req, res) {
  const { collectionId } = req.query;

  if (!collectionId) {
    return res.status(400).json({ error: "Collection ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { resources } = req.body;

    if (!Array.isArray(resources)) {
      return res.status(400).json({ error: "Resources array is required" });
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

    // Update resource order
    const updatedResources = resources.map((resourceId, index) => {
      const existing = collection.resources.find(
        (r) => r.resourceId === resourceId
      );
      return {
        resourceId,
        order: index,
        addedAt: existing?.addedAt || new Date(),
      };
    });

    await db.collection("resourceCollections").updateOne(
      { _id: collectionId },
      {
        $set: {
          resources: updatedResources,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      resources: updatedResources,
    });
  } catch (error) {
    console.error("Reorder API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
