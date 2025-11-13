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
      // Get all reviews for the resource
      const reviews = await db
        .collection("resourceReviews")
        .find({ resourceId })
        .sort({ createdAt: -1 })
        .toArray();

      // Get author details for each review
      const reviewsWithAuthors = await Promise.all(
        reviews.map(async (review) => {
          const author = await db
            .collection("users")
            .findOne({ _id: review.userId })
            .project({ name: 1, email: 1, image: 1 });

          return {
            ...review,
            author,
          };
        })
      );

      return res.status(200).json({
        reviews: reviewsWithAuthors,
        count: reviewsWithAuthors.length,
      });
    }

    if (req.method === "POST") {
      // Create new review
      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { review, rating } = req.body;

      if (!review?.trim()) {
        return res.status(400).json({ error: "Review content is required" });
      }

      // Check if user already reviewed
      const existingReview = await db.collection("resourceReviews").findOne({
        resourceId,
        userId: session.user.id,
      });

      if (existingReview) {
        // Update existing review
        await db.collection("resourceReviews").updateOne(
          {
            resourceId,
            userId: session.user.id,
          },
          {
            $set: {
              review: review.trim(),
              rating,
              updatedAt: new Date(),
            },
          }
        );

        const author = await db
          .collection("users")
          .findOne({ _id: session.user.id })
          .project({ name: 1, email: 1, image: 1 });

        return res.status(200).json({
          success: true,
          review: {
            ...existingReview,
            review: review.trim(),
            rating,
            author,
          },
        });
      }

      // Create new review
      const newReview = {
        resourceId,
        userId: session.user.id,
        review: review.trim(),
        rating,
        helpful: 0,
        verified: false, // Can be set to true if user has interacted with resource
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .collection("resourceReviews")
        .insertOne(newReview);

      // Get author details
      const author = await db
        .collection("users")
        .findOne({ _id: session.user.id })
        .project({ name: 1, email: 1, image: 1 });

      // Create notification for resource owner
      const resource = await db
        .collection("resources")
        .findOne({ _id: resourceId });
      if (resource && resource.createdBy !== session.user.id) {
        await db.collection("notifications").insertOne({
          userId: resource.createdBy,
          type: "resource_review",
          message: `${session.user.name} reviewed your resource`,
          resourceId,
          reviewId: result.insertedId,
          fromUser: session.user.id,
          read: false,
          createdAt: new Date(),
        });
      }

      return res.status(201).json({
        success: true,
        review: {
          ...newReview,
          _id: result.insertedId,
          author,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Reviews API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
