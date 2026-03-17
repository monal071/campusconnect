// Character set excluding ambiguous characters (0/O, 1/l/I)
const CHARSET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 7;

export function generateCommunityCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export async function generateUniqueCommunityCode(db) {
  const collection = db.collection("communities");
  let attempts = 0;

  while (attempts < 10) {
    const code = generateCommunityCode();
    const existing = await collection.findOne({ code });
    if (!existing) return code;
    attempts++;
  }

  throw new Error("Failed to generate unique community code");
}
