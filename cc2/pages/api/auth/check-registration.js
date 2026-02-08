import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the session from the server side
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({
        message: "Not authenticated",
        isRegistered: false,
      });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Look up the user by email
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    });

    console.log(
      "🔍 Check registration for:",
      session.user.email,
      "Found user:",
      !!user,
      "Role:",
      user?.role,
    );

    // Check if the user exists and has a role
    if (user && user.role) {
      console.log("✅ User is registered with role:", user.role);
      return res.status(200).json({
        isRegistered: true,
        role: user.role,
      });
    } else {
      console.log("⚠️ User not registered or no role");
      return res.status(200).json({
        isRegistered: false,
      });
    }
  } catch (error) {
    console.error("Check registration error:", error);
    return res.status(500).json({
      message: "Internal server error",
      isRegistered: false,
    });
  }
}
