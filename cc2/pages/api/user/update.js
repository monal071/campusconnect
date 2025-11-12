import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

// Configure API route to handle larger payloads (for images)
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
    // Get the authenticated user's session
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No session found" });
    }

    const { name, image } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db();

    // Check if user exists first
    const existingUser = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!existingUser) {
      // User doesn't exist in database, create them
      const newUser = {
        name,
        email: session.user.email,
        image: image || session.user.image || "",
        role: session.user.role || "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await db.collection("users").insertOne(newUser);

      if (insertResult.acknowledged) {
        const createdUser = await db
          .collection("users")
          .findOne(
            { _id: insertResult.insertedId },
            { projection: { password: 0 } }
          );

        return res.status(200).json({
          success: true,
          message: "Profile created successfully",
          user: createdUser,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Failed to create user profile" });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      updatedAt: new Date(),
    };

    // Only update image if provided
    if (image) {
      updateData.image = image;
    }

    // Update user in database
    await db
      .collection("users")
      .updateOne({ email: session.user.email }, { $set: updateData });

    // Fetch the updated user
    const updatedUser = await db
      .collection("users")
      .findOne({ email: session.user.email }, { projection: { password: 0 } });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
}
