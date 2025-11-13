import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Delete resources with unknown/missing authors
    const result = await db.collection("resources").deleteMany({
      $or: [
        { author: "Unknown User" },
        { author: { $exists: false } },
        { author: null },
        { author: "" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} resources with unknown authors`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning resources:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
