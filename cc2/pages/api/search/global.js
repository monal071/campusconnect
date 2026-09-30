import clientPromise, { getQuizDb } from "../../../utils/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { withRateLimit } from "../../../lib/rateLimiter";

async function searchHandler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) return res.status(401).json({ error: "Please sign in to search." });
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const type = req.query.type || "all";
    if (query.length < 3 || query.length > 100) return res.status(400).json({ error: "Use between 3 and 100 characters." });
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const specs = [
      { type: "posts", fields: ["content", "tags"] },
      { type: "resources", fields: ["title", "description", "tags"], filter: { isPublic: { $ne: false } } },
      // Students join by code; faculty can search only their own quizzes.
      { type: "quizzes", fields: ["quizName", "description"], filter: { createdBy: { $in: [session.user.id, session.user.email] } } },
      { type: "events", fields: ["title", "description"], filter: { status: "approved" } },
      { type: "jobs", fields: ["title", "description", "company"], filter: { status: "approved" } },
      { type: "communities", fields: ["name", "description"], filter: { $or: [{ isPrivate: false }, { isPrivate: { $exists: false } }, { members: session.user.id }] } },
    ];
    if (type !== "all" && !specs.some((spec) => spec.type === type)) return res.status(400).json({ error: "Invalid search category" });
    const client = await clientPromise;
    const db = client.db();
    const groups = await Promise.all(specs.filter((spec) => type === "all" || spec.type === type).map(async (spec) => {
      const documents = await (spec.type === "quizzes" ? getQuizDb(client) : db).collection(spec.type).find({
        $and: [spec.filter || {}, { $or: spec.fields.map((field) => ({ [field]: regex })) }],
      }, { projection: { title: 1, name: 1, quizName: 1, content: 1, description: 1, "author.name": 1 } })
        .sort({ createdAt: -1 }).limit(5).maxTimeMS(3000).toArray();
      // Explicit summary fields keep quiz answers, codes, and membership data private.
      return documents.map((document) => ({
        _id: document._id, type: spec.type,
        title: document.title || document.quizName || document.name || (document.content || "").slice(0, 100),
        description: (document.description || "").slice(0, 180),
        author: document.author?.name || "",
      }));
    }));
    return res.status(200).json({ results: groups.flat().slice(0, 20) });
  } catch (error) {
    console.error("Global search failed:", error.message);
    return res.status(500).json({ error: "Search is temporarily unavailable. Please try again." });
  }
}
export default withRateLimit(searchHandler, "api");
