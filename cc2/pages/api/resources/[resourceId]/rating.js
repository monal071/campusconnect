import { connectToDatabase } from "../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req, res) {
  const { resourceId } = req.query;

  if (!resourceId) {
    return res.status(400).json({ error: "Resource ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      // Get overall rating and user's rating
      const ratings = await db
        .collection("resourceRatings")
        .find({ resourceId })
        .toArray();

      if (ratings.length === 0) {
        return res.status(200).json({
          rating: {
            average: 0,
            count: 0,
            breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
          userRating: null,
        });
      }

      // Calculate average
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / ratings.length;

      // Calculate breakdown
      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r) => {
        breakdown[r.rating]++;
      });

      // Get user's rating
      const userRating = session?.user
        ? ratings.find((r) => r.userId === session.user.id)?.rating || null
        : null;

      return res.status(200).json({
        rating: {
          average,
          count: ratings.length,
          breakdown,
        },
        userRating,
      });
    }

    if (req.method === "POST") {
      // Submit or update rating
      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }

      // Update or insert rating
      await db.collection("resourceRatings").updateOne(
        {
          resourceId,
          userId: session.user.id,
        },
        {
          $set: {
            rating,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            resourceId,
            userId: session.user.id,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Recalculate average rating
      const allRatings = await db
        .collection("resourceRatings")
        .find({ resourceId })
        .toArray();

      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / allRatings.length;

      const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allRatings.forEach((r) => {
        breakdown[r.rating]++;
      });

      // Update resource with average rating
      await db.collection("resources").updateOne(
        { _id: resourceId },
        {
          $set: {
            averageRating: average,
            ratingCount: allRatings.length,
          },
        }
      );

      return res.status(200).json({
        success: true,
        rating: {
          average,
          count: allRatings.length,
          breakdown,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Rating API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
