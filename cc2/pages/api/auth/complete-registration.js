import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { fullName, institute, department, semester, bio, role } = req.body;

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!institute) {
      return res.status(400).json({ message: "Institute is required" });
    }
    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }
    if (!role || !["student", "faculty"].includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }
    if (role === "student" && !semester) {
      return res
        .status(400)
        .json({ message: "Semester is required for students" });
    }

    const client = await clientPromise;
    const db = client.db();

    const email = session.user.email.toLowerCase();

    // Build update data
    const updateData = {
      name: fullName.trim(),
      role,
      institute,
      department,
      semester: role === "student" ? semester : null,
      bio: bio?.trim() || "",
      isProfileComplete: true,
      updatedAt: new Date(),
    };

    // Update user with all profile data
    const updateResult = await db
      .collection("users")
      .updateOne({ email }, { $set: updateData });

    if (updateResult.matchedCount === 0) {
      // User doesn't exist yet, create them
      await db.collection("users").insertOne({
        email,
        image: session.user.image,
        connections: [],
        pendingRequests: [],
        createdAt: new Date(),
        ...updateData,
      });
    }

    return res.status(200).json({
      success: true,
      role,
      message: "Registration completed successfully",
    });
  } catch (error) {
    console.error("Complete registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
