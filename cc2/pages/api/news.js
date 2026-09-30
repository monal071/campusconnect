import clientPromise from "../../utils/mongodb";
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const client = await clientPromise;
    return res.status(200).json(await client.db().collection("news").find({ status: "published" }).sort({ publishedAt: -1 }).limit(20).toArray());
  } catch { return res.status(500).json({ error: "Failed to fetch news" }); }
}
