import { authOptions } from '../auth/[...nextauth]';

export default function handler(req, res) {
  try {
    // Return public auth config for debugging (no secrets)
    return res.status(200).json({
      providers: authOptions.providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        // Don't include client secrets
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
      })),
      callbackUrl: process.env.NEXTAUTH_URL,
      baseUrl: process.env.NEXTAUTH_URL,
      session: {
        strategy: authOptions.session?.strategy || 'default'
      },
      pages: authOptions.pages
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return res.status(500).json({ error: "Failed to get auth configuration" });
  }
}
