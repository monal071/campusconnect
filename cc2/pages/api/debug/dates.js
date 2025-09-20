export default function handler(req, res) {
  const now = new Date();
  const sampleDeadline = "2025-09-30T13:55:00"; // Sep 30, 2025, 01:55 PM
  const deadline = new Date(sampleDeadline);
  
  res.status(200).json({
    currentTime: {
      iso: now.toISOString(),
      local: now.toLocaleString(),
      timestamp: now.getTime()
    },
    sampleDeadline: {
      original: sampleDeadline,
      parsed: deadline.toISOString(),
      local: deadline.toLocaleString(),
      timestamp: deadline.getTime()
    },
    comparison: {
      nowLessThanDeadline: now < deadline,
      deadlineLessThanNow: deadline < now,
      isExpired: deadline < now,
      minutesRemaining: Math.ceil((deadline - now) / (1000 * 60))
    }
  });
}