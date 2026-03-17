import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No session found" });
    }

    const { name, image, bio, department, institute, semester } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const email = session.user.email.toLowerCase();

    // Build update data
    const updateData = {
      name: name.trim(),
      updatedAt: new Date(),
    };

    // Only update optional fields if provided
    if (image) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio.trim();
    if (department) updateData.department = department;
    if (institute) updateData.institute = institute;
    if (semester !== undefined) updateData.semester = semester;

    // Update user in database
    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: updateData });

    if (result.matchedCount === 0) {
      // User doesn't exist, create them
      await db.collection("users").insertOne({
        email,
        image: image || session.user.image || "",
        role: session.user.role || "student",
        connections: [],
        pendingRequests: [],
        createdAt: new Date(),
        ...updateData,
      });
    }

    // Fetch the updated user
    const updatedUser = await db
      .collection("users")
      .findOne({ email }, { projection: { password: 0 } });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
}
