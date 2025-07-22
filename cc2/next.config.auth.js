// This file extends next.config.js with environment variables
// that are essential for NextAuth to work properly

module.exports = {
  // Your existing Next.js configuration
  ...require('./next.config.js'),
  
  // Set environment variables at build time
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    // Add other public environment variables here
  }
}
