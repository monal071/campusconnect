import clientPromise from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { q: query, type = "all" } = req.query;

    if (!query || query.length < 3) {
      return res
        .status(400)
        .json({ error: "Search query must be at least 3 characters" });
    }

    const client = await clientPromise;
    const db = client.db();

    const searchRegex = new RegExp(query, "i");
    let results = [];

    // Search in different collections based on type
    if (type === "all" || type === "resources") {
      const resources = await db
        .collection("resources")
        .find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { tags: searchRegex },
          ],
        })
        .limit(5)
        .toArray();

      results.push(
        ...resources.map((resource) => ({
          ...resource,
          type: "resources",
        })),
      );
    }

    if (type === "all" || type === "quizzes") {
      const quizzes = await db
        .collection("quizzes")
        .find({
          $or: [{ quizName: searchRegex }, { description: searchRegex }],
        })
        .limit(5)
        .toArray();

      results.push(
        ...quizzes.map((quiz) => ({
          ...quiz,
          type: "quizzes",
        })),
      );
    }

    if (type === "all" || type === "events") {
      const events = await db
        .collection("events")
        .find({
          $or: [{ title: searchRegex }, { description: searchRegex }],
        })
        .limit(5)
        .toArray();

      results.push(
        ...events.map((event) => ({
          ...event,
          type: "events",
        })),
      );
    }

    if (type === "all" || type === "jobs") {
      const jobs = await db
        .collection("jobs")
        .find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { company: searchRegex },
          ],
        })
        .limit(5)
        .toArray();

      results.push(
        ...jobs.map((job) => ({
          ...job,
          type: "jobs",
        })),
      );
    }

    if (type === "all" || type === "communities") {
      const communities = await db
        .collection("communities")
        .find({
          $or: [{ name: searchRegex }, { description: searchRegex }],
        })
        .limit(5)
        .toArray();

      results.push(
        ...communities.map((community) => ({
          ...community,
          type: "communities",
        })),
      );
    }

    // Sort by relevance (you can implement better scoring)
    results = results.slice(0, 20);

    res.status(200).json({ results });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
}
