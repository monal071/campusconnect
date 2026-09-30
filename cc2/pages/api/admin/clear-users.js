export default function handler(req, res) {
  return res.status(410).json({ message: "Bulk account reset is disabled. Manage individual accounts instead." });
}
