import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise, { getQuizDb } from "../../../utils/mongodb";
import { startQuizAttempt, saveQuizAttempt } from "../../../lib/quiz-attempts";
import { sendApiError } from "../../../lib/api-errors";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["POST", "PUT"].includes(req.method)) return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Sign in to continue" });
    if (session.user.role !== "student") return res.status(403).json({ message: "Only students can take quizzes" });
    const client = await clientPromise;
    const db = getQuizDb(client);
    const result = req.method === "POST"
      ? await startQuizAttempt(client, db, req.body?.quizId, session.user.id)
      : await saveQuizAttempt(db, session.user.id, req.body || {});
    return res.status(200).json(result);
  } catch (error) { return sendApiError(res, error); }
}
