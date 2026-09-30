// Read-only by default. --apply-indexes creates indexes without changing records.
const { loadEnvConfig } = require("@next/env");
const { MongoClient } = require("mongodb");
const specs = require("./database-indexes.json");
loadEnvConfig(process.cwd());
async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB, serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    for (const [area, collections] of Object.entries(specs)) {
      const db = area === "quiz" ? client.db(process.env.MONGODB_QUIZ_DB || "campusconnect") : client.db();
      const present = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name));
      const report = [];
      for (const [name, indexes] of Object.entries(collections)) {
        const collection = db.collection(name);
        if (process.argv.includes("--apply-indexes")) {
          for (const { key, ...options } of indexes) await collection.createIndex(key, options);
        }
        const existing = present.has(name) || process.argv.includes("--apply-indexes");
        report.push({ collection: name, count: existing ? await collection.estimatedDocumentCount() : 0, indexes: existing ? (await collection.indexes()).map(i => i.key) : [], connected: true });
      }
      console.log(JSON.stringify({ area, database: db.databaseName, collections: report }, null, 2));
    }
  } finally { await client.close(); }
}
main().catch(error => { console.error("Database audit failed:", error.codeName || error.name); process.exitCode = 1; });
