import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all communities where user is creator and have pending requests
    const communities = await db
      .collection("communities")
      .find({
        creatorId: user._id.toString(),
        pendingRequests: { $exists: true, $not: { $size: 0 } },
      })
      .toArray();

    // Get details of all pending requests
    const pendingRequests = [];

    for (const community of communities) {
      if (community.pendingRequests && community.pendingRequests.length > 0) {
        // Get requester details
        const requesterIds = community.pendingRequests.map(
          (id) => new ObjectId(id)
        );
        const requesters = await db
          .collection("users")
          .find({ _id: { $in: requesterIds } })
          .project({ name: 1, email: 1, image: 1, title: 1 })
          .toArray();

        requesters.forEach((requester) => {
          pendingRequests.push({
            communityId: community._id.toString(),
            communityName: community.name,
            requester: {
              id: requester._id.toString(),
              name: requester.name,
              email: requester.email,
              image: requester.image,
              title: requester.title,
            },
          });
        });
      }
    }

    return res.status(200).json({
      success: true,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch pending requests" });
  }
}
