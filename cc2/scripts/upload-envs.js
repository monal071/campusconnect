const { execSync } = require("child_process");

const envs = {
  MONGODB_URI: "mongodb+srv://cc:123%40abc@campusconnect.jligiuz.mongodb.net/?retryWrites=true&w=majority&appName=campusconnect",
  JWT_SECRET: "supersecretkey123!@@",
  NEXTAUTH_SECRET: "supersecretkey123!@@",
  NEXTAUTH_URL: "https://campusconnect-omega-sage.vercel.app",
  GOOGLE_CLIENT_ID: "695876022236-cjil2brker4shcmj57scsml3t2pdtrvd.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "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",
  UPLOADTHING_TOKEN: "eyJhcGlLZXkiOiJza19saXZlX2Y0YzI4ODczNGUyZjkxNWQxZjYxNTMyZTM5MTAyNzQ4ZDhiODlhMzc4MDhkN2M1Nzg1MjFiM2NjMDM0ZWVhZWYiLCJhcHBJZCI6IjVoYnZtbmpoODIiLCJyZWdpb25zIjpbInNlYTEiXX0=",
  UPLOADTHING_SECRET: "sk_live_f4c288734e2f915d1f61532e39102748d8b89a37808d7c578521b3cc034eeaef",
  UPLOADTHING_APP_ID: "5hbvmnjh82",
};

const targets = ["production", "preview", "development"];

for (const [key, value] of Object.entries(envs)) {
  for (const target of targets) {
    console.log(`Adding ${key} (${target})...`);
    try {
      execSync(`npx vercel env add ${key} ${target}`, {
        input: value,
        stdio: ["pipe", "pipe", "pipe"],
      });
      console.log(`✓ Added ${key} (${target})`);
    } catch (err) {
      console.log(`Note for ${key} (${target}):`, err.stderr ? err.stderr.toString() : err.message);
    }
  }
}

console.log("All environment variables uploaded to Vercel!");
