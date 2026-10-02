// Every authenticated request uses current account permissions. Never retain a
// privileged JWT when the account disappears or its database cannot be checked.
export async function refreshSessionToken(db, token, user) {
  const email = (user?.email || token.email)?.toLowerCase();
  if (!email) return null;
  const account = await db.collection("users").findOne({ email }, {
    projection: { role: 1, department: 1, institute: 1, isProfileComplete: 1, createdAt: 1, name: 1, image: 1, disabled: 1 },
  });
  if (!account || account.disabled || (!user && token.userId && token.userId !== String(account._id))) return null;
  return { ...token, email, userId: String(account._id), role: account.role || null,
    department: account.department || null, institute: account.institute || null,
    isProfileComplete: account.isProfileComplete || false,
    createdAt: account.createdAt?.toISOString?.() || null,
    dbName: account.name, dbImage: account.image };
}
