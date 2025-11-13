import { connectToDatabase } from "../../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";

export default async function handler(req, res) {
  const { resourceId } = req.query;

  if (!resourceId) {
    return res.status(400).json({ error: "Resource ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { versionId } = req.body;

    if (!versionId) {
      return res.status(400).json({ error: "Version ID is required" });
    }

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

    // Get the version to restore
    const versionToRestore = await db
      .collection("resourceVersions")
      .findOne({ _id: versionId });

    if (!versionToRestore) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Create a new version from current state (before restoring)
    const latestVersion = await db
      .collection("resourceVersions")
      .findOne({ resourceId }, { sort: { version: -1 } });

    const backupVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    await db.collection("resourceVersions").insertOne({
      resourceId,
      userId: session.user.id,
      version: backupVersionNumber,
      content: resource.content || resource.description,
      title: resource.title,
      type: resource.type,
      url: resource.url,
      changeNote: `Backup before restoring to version ${versionToRestore.version}`,
      size: JSON.stringify(resource).length,
      changes: {
        added: 0,
        removed: 0,
        modified: 1,
      },
      createdAt: new Date(),
    });

    // Restore the resource to the selected version
    await db.collection("resources").updateOne(
      { _id: resourceId },
      {
        $set: {
          title: versionToRestore.title,
          content: versionToRestore.content,
          description: versionToRestore.content,
          type: versionToRestore.type,
          url: versionToRestore.url,
          currentVersion: backupVersionNumber + 1,
          lastVersionAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Create a new version entry for the restore
    await db.collection("resourceVersions").insertOne({
      resourceId,
      userId: session.user.id,
      version: backupVersionNumber + 1,
      content: versionToRestore.content,
      title: versionToRestore.title,
      type: versionToRestore.type,
      url: versionToRestore.url,
      changeNote: `Restored from version ${versionToRestore.version}`,
      size: versionToRestore.size,
      changes: {
        added: 0,
        removed: 0,
        modified: 1,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Restored to version ${versionToRestore.version}`,
      newVersion: backupVersionNumber + 1,
    });
  } catch (error) {
    console.error("Restore version API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
