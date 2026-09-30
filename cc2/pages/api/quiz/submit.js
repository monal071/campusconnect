import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise, { getQuizDb } from "../../../utils/mongodb";
import { submitQuiz } from "../../../lib/quiz-submissions";
import { sendApiError } from "../../../lib/api-errors";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ message: "Not authenticated" });
    const client = await clientPromise;
    const profile = await client.db().collection("users").findOne({ email: session.user.email });
    if (profile?.role !== "student") return res.status(403).json({ message: "Only students can submit quizzes" });
    return res.status(200).json(await submitQuiz(client, getQuizDb(client), { ...profile, id: String(profile._id) }, req.body || {}));
  } catch (error) { return sendApiError(res, error); }
}
