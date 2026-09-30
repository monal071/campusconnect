import posts from "../../posts";
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  req.method = "PUT";
  req.body = { action: "like" };
  return posts(req, res);
}
