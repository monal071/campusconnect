import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../utils/mongodb";

// Allowed email domains for Charusat university
const ALLOWED_DOMAINS = ["charusat.edu.in", "charusat.ac.in"];

function isAllowedEmail(email) {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return ALLOWED_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
}

// Detect role from email pattern
// Students: enrollment numbers like 23dce087@charusat.edu.in
// Faculty/staff: name-based emails like john.doe@charusat.edu.in
function detectRoleFromEmail(email) {
  const localPart = email.toLowerCase().split("@")[0];
  // Student pattern: starts with 2 digits (year), then department code, then number
  if (/^\d{2}[a-z]{2,4}\d{2,4}$/.test(localPart)) {
    return "student";
  }
  return "faculty";
}

// Extract department from student email (e.g., 23dce087 -> DCE)
function extractDeptFromEmail(email) {
  const localPart = email.toLowerCase().split("@")[0];
  const match = localPart.match(/^\d{2}([a-z]{2,4})\d{2,4}$/);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          hd: "charusat.edu.in", // Restrict Google account chooser to Charusat domain
        },
      },
      httpOptions: {
        timeout: 20000,
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Only refresh token once per day (was 5 min - caused excessive DB queries)
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user }) {
      try {
        const email = user.email?.toLowerCase();

        // BLOCK non-Charusat emails
        if (!isAllowedEmail(email)) {
          console.log("Blocked sign-in from non-Charusat email:", email);
          return "/login?error=AccessDenied&message=Only+Charusat+university+emails+are+allowed";
        }

        const client = await Promise.race([
          clientPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("MongoDB timeout")), 10000),
          ),
        ]);
        const db = client.db();

        const existingUser = await db.collection("users").findOne({ email });

        if (!existingUser) {
          // Create new user - detect role from email pattern
          const detectedRole = detectRoleFromEmail(email);
          const dept = extractDeptFromEmail(email);

          await db.collection("users").insertOne({
            email,
            name: user.name,
            image: user.image,
            role: null, // Will be confirmed during registration
            detectedRole,
            department: dept,
            institute: null,
            enrollmentNo:
              detectedRole === "student"
                ? email.split("@")[0].toUpperCase()
                : null,
            bio: "",
            connections: [],
            pendingRequests: [],
            isProfileComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log("New Charusat user created:", email);
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return true; // Allow sign in even if DB fails
      }
    },

    async redirect({ url, baseUrl }) {
      // After sign-in, go to dashboard (login page handles role check)
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user, trigger }) {
      // On first sign-in or when session update is triggered
      if (user || trigger === "update" || !token.role) {
        try {
          const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("MongoDB timeout")), 3000),
            ),
          ]);
          const db = client.db();
          const dbUser = await db
            .collection("users")
            .findOne({ email: (user?.email || token.email)?.toLowerCase() });

          if (dbUser) {
            token.role = dbUser.role || null;
            token.userId = dbUser._id.toString();
            token.department = dbUser.department || null;
            token.institute = dbUser.institute || null;
            token.isProfileComplete = dbUser.isProfileComplete || false;
            token.createdAt = dbUser.createdAt?.toISOString?.() || null;
            token.dbName = dbUser.name;
            token.dbImage = dbUser.image;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Use JWT data directly - NO extra DB query needed
      if (session?.user) {
        session.user.id = token.userId || token.sub;
        session.user.role = token.role || null;
        session.user.department = token.department || null;
        session.user.institute = token.institute || null;
        session.user.isProfileComplete = token.isProfileComplete || false;
        session.user.createdAt = token.createdAt || null;
        // Use DB name/image if available (allows profile updates to reflect)
        if (token.dbName) session.user.name = token.dbName;
        if (token.dbImage) session.user.image = token.dbImage;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
