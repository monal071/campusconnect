export default function handler(req, res) {
  return res.status(410).json({ message: "This endpoint has been removed" });
}
