const { MongoClient } = require("mongodb");

const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/campusconnect";

async function deleteUnknownResources() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const resourcesCollection = db.collection("resources");

    // Find resources with "Unknown User" as author
    const unknownResources = await resourcesCollection
      .find({
        $or: [
          { author: "Unknown User" },
          { author: { $exists: false } },
          { author: null },
          { author: "" },
        ],
      })
      .toArray();

    console.log(
      `Found ${unknownResources.length} resources with unknown authors:`
    );
    unknownResources.forEach((resource) => {
      console.log(`- ${resource.title} (ID: ${resource._id})`);
    });

    if (unknownResources.length > 0) {
      const result = await resourcesCollection.deleteMany({
        $or: [
          { author: "Unknown User" },
          { author: { $exists: false } },
          { author: null },
          { author: "" },
        ],
      });

      console.log(
        `\nDeleted ${result.deletedCount} resources with unknown authors.`
      );
    } else {
      console.log("\nNo resources with unknown authors found.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

deleteUnknownResources();
