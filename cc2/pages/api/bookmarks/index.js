import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.method === "GET") {
      // Get all bookmarks for the user
      const { type } = req.query; // post, resource, event, job, quiz

      const bookmarks = await db
        .collection("bookmarks")
        .find({
          userId: user._id,
          ...(type && type !== "all" ? { type } : {}),
        })
        .sort({ createdAt: -1 })
        .toArray();

      // Populate the bookmarked items
      const populatedBookmarks = await Promise.all(
        bookmarks.map(async (bookmark) => {
          let item = null;

          try {
            switch (bookmark.type) {
              case "post":
                item = await db
                  .collection("posts")
                  .findOne({ _id: new ObjectId(bookmark.itemId) });
                break;
              case "resource":
                item = await db
                  .collection("resources")
                  .findOne({ _id: new ObjectId(bookmark.itemId) });
                break;
              case "event":
                item = await db
                  .collection("events")
                  .findOne({ _id: new ObjectId(bookmark.itemId) });
                break;
              case "job":
                item = await db
                  .collection("jobs")
                  .findOne({ _id: new ObjectId(bookmark.itemId) });
                break;
              case "quiz":
                item = await db
                  .collection("quizzes")
                  .findOne({ _id: new ObjectId(bookmark.itemId) });
                break;
            }
          } catch (error) {
            console.error("Error fetching bookmarked item:", error);
          }

          return {
            ...bookmark,
            item,
          };
        })
      );

      // Filter out bookmarks where item was deleted
      const validBookmarks = populatedBookmarks.filter((b) => b.item !== null);

      res.status(200).json({ bookmarks: validBookmarks });
    } else if (req.method === "POST") {
      // Add bookmark
      const { itemId, type, title, description } = req.body;

      if (!itemId || !type) {
        return res.status(400).json({ error: "Item ID and type are required" });
      }

      // Check if already bookmarked
      const existing = await db.collection("bookmarks").findOne({
        userId: user._id,
        itemId: itemId,
        type,
      });

      if (existing) {
        return res.status(400).json({ error: "Already bookmarked" });
      }

      const bookmark = {
        userId: user._id,
        itemId,
        type,
        title: title || "",
        description: description || "",
        createdAt: new Date(),
      };

      const result = await db.collection("bookmarks").insertOne(bookmark);

      res.status(201).json({
        message: "Bookmark added successfully",
        bookmark: { ...bookmark, _id: result.insertedId },
      });
    } else if (req.method === "DELETE") {
      // Remove bookmark
      const { itemId, type } = req.query;

      if (!itemId || !type) {
        return res.status(400).json({ error: "Item ID and type are required" });
      }

      const result = await db.collection("bookmarks").deleteOne({
        userId: user._id,
        itemId,
        type,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      res.status(200).json({ message: "Bookmark removed successfully" });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Bookmarks error:", error);
    res.status(500).json({ error: "Failed to process bookmark" });
  }
}
