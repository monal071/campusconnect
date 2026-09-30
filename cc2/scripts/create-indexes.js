// Run from cc2: node scripts/create-indexes.js
process.argv.push("--apply-indexes");
require("./audit-database.cjs");
