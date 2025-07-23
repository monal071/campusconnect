import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  // Only allow GET and POST methods
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;

    // Handle GET request - fetch dashboard layout
    if (req.method === "GET") {
      const userPreferences = await db.collection("dashboardPreferences").findOne({ userId });

      // Default layout if none is saved
      const defaultLayout = {
        widgets: [
          { id: "welcome", enabled: true, position: 0 },
          { id: "stats", enabled: true, position: 1 },
          { id: "activity", enabled: true, position: 2 },
          { id: "events", enabled: true, position: 3 },
          { id: "jobs", enabled: true, position: 4 },
          { id: "resources", enabled: true, position: 5 },
          { id: "news", enabled: true, position: 6 },
          { id: "quickActions", enabled: true, position: 7 }
        ],
        theme: "default"
      };

      return res.status(200).json({
        message: "Dashboard layout retrieved",
        layout: userPreferences?.layout || defaultLayout
      });
    }

    // Handle POST request - update dashboard layout
    if (req.method === "POST") {
      const { layout } = req.body;

      if (!layout) {
        return res.status(400).json({ message: "Missing layout data" });
      }

      // Update or insert user preferences
      await db.collection("dashboardPreferences").updateOne(
        { userId },
        { 
          $set: { 
            layout,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      return res.status(200).json({
        message: "Dashboard layout updated successfully"
      });
    }
  } catch (error) {
    console.error("Error with dashboard layout:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
