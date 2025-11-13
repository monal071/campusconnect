import { connectToDatabase } from "../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req, res) {
  const { resourceId } = req.query;

  if (!resourceId) {
    return res.status(400).json({ error: "Resource ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      // Get version history
      const versions = await db
        .collection("resourceVersions")
        .find({ resourceId })
        .sort({ version: -1 })
        .toArray();

      // Get author details for each version
      const versionsWithAuthors = await Promise.all(
        versions.map(async (version) => {
          const author = await db
            .collection("users")
            .findOne({ _id: version.userId })
            .project({ name: 1, email: 1, image: 1 });

          return {
            ...version,
            author,
          };
        })
      );

      return res.status(200).json({
        versions: versionsWithAuthors,
        count: versionsWithAuthors.length,
      });
    }

    if (req.method === "POST") {
      // Create new version
      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { changeNote } = req.body;

      // Verify resource ownership
      const resource = await db
        .collection("resources")
        .findOne({ _id: resourceId });

      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }

      if (resource.createdBy !== session.user.id) {
        return res
          .status(403)
          .json({ error: "Unauthorized - not resource owner" });
      }

      // Get latest version number
      const latestVersion = await db
        .collection("resourceVersions")
        .findOne({ resourceId }, { sort: { version: -1 } });

      const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

      // Create version snapshot
      const newVersion = {
        resourceId,
        userId: session.user.id,
        version: newVersionNumber,
        content: resource.content || resource.description,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        changeNote: changeNote?.trim() || "Updated resource",
        size: JSON.stringify(resource).length,
        changes: {
          added: 0,
          removed: 0,
          modified: 1, // Simplified - could calculate actual diff
        },
        createdAt: new Date(),
      };

      const result = await db
        .collection("resourceVersions")
        .insertOne(newVersion);

      // Update resource with current version
      await db.collection("resources").updateOne(
        { _id: resourceId },
        {
          $set: {
            currentVersion: newVersionNumber,
            lastVersionAt: new Date(),
          },
        }
      );

      return res.status(201).json({
        success: true,
        version: {
          ...newVersion,
          _id: result.insertedId,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Versions API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
