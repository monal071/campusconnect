// CommonJS version for Node.js compatibility
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// Validate environment variables
const requiredVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
];
const missingVars = requiredVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(
    `Missing AWS environment variables: ${missingVars.join(', ')}. DynamoDB connection will fail.`
  );
}

let docClientInstance;
function getDocClient() {
  if (!docClientInstance) {
    try {
      const client = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        maxAttempts: 5, // Retry logic
      });
      docClientInstance = DynamoDBDocumentClient.from(client);
      console.log("DynamoDB client initialized.");
    } catch (err) {
      console.error("Failed to initialize DynamoDB client:", err);
      throw err;
    }
  }
  return docClientInstance;
}

module.exports = {
  getDocClient,
  docClient: getDocClient(),
};
