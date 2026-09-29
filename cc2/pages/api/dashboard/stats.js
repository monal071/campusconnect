import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) return res.status(401).json({ error: "Not authenticated" });
    const client = await clientPromise;
    const db = client.db();
    const { id, email, role } = session.user;
    const ids = ObjectId.isValid(id) ? [id, new ObjectId(id)] : [id];
    const teaches = role === "faculty" || role === "admin";
    const quizFilter = { createdBy: { $in: [id, email] } };
    const [connections, posts, events, resources, jobs, totalQuizzes, activeQuizzes] = await Promise.all([
      db.collection("connections").countDocuments({ $or: [{ user1Id: email }, { user2Id: email }] }),
      db.collection("posts").countDocuments({ "author.id": id }),
      db.collection("events").countDocuments({ createdBy: id }),
      db.collection("resources").countDocuments({ userId: { $in: ids } }),
      db.collection("jobs").countDocuments({ $or: [{ createdBy: id }, { postedBy: id }] }),
      teaches ? db.collection("quizzes").countDocuments(quizFilter) : 0,
      teaches ? db.collection("quizzes").countDocuments({ ...quizFilter, isActive: true }) : 0,
    ]);
    return res.status(200).json({ data: { connections, posts, events, resources, jobs,
      quizzes: { totalQuizzes, activeQuizzes, submissions: 0, averageScore: 0 } } });
  } catch (error) {
    console.error("Dashboard stats failed:", error.message);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
}
