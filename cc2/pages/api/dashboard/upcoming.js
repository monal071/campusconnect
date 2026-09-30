import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { upcomingEvents } from "../../../lib/dashboard";
import { sendApiError } from "../../../lib/api-errors";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const client = await clientPromise;
    return res.status(200).json({ data: await upcomingEvents(client.db(), session.user.id) });
  } catch (error) { return sendApiError(res, error); }
}
