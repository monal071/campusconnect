import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const client = await clientPromise;
    const db = client.db();

    let user;
    try {
      user = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(userId) },
          { projection: { password: 0 } },
        );
    } catch {
      // If ObjectId parsing fails, try by email
      user = await db
        .collection("users")
        .findOne(
          { email: userId.toLowerCase() },
          { projection: { password: 0 } },
        );
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the viewer is the profile owner
    const session = await getServerSession(req, res, authOptions);
    const isOwner =
      session?.user?.email?.toLowerCase() === user.email?.toLowerCase();

    // Build public profile response
    const profile = {
      _id: user._id.toString(),
      name: user.name,
      image: user.image,
      role: user.role,
      department: user.department || null,
      institute: user.institute || null,
      semester: user.semester || null,
      bio: user.bio || "",
      enrollmentNo: user.enrollmentNo || null,
      createdAt: user.createdAt,
      connectionsCount: user.connections?.length || 0,
      isOwner,
    };

    // Include email only for the owner
    if (isOwner) {
      profile.email = user.email;
    }

    return res.status(200).json({ success: true, user: profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}
