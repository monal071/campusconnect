import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db();

    const email = session.user.email.toLowerCase();

    // Delete the user
    const deleteResult = await db.collection("users").deleteOne({ email });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Also delete user's sessions and accounts (NextAuth related)
    await db.collection("sessions").deleteMany({ userId: session.user.id });
    await db.collection("accounts").deleteMany({ userId: session.user.id });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
