export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function sendApiError(res, error) {
  if (!error.status) console.error("API request failed:", error.message);
  const message = error.status ? error.message : "Something went wrong. Please try again.";
  return res.status(error.status || 500).json({ error: message, message });
}
