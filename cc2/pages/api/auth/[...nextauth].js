import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from '../../../utils/mongodb';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      // Always fetch the MongoDB user and set the correct _id as session.user.id
      if (session?.user?.email) {
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email: session.user.email.toLowerCase() });
        if (user && user._id) {
          session.user.id = user._id.toString();
          session.user.name = user.name;
          session.user.role = user.role || 'user'; // Add role to session
        } else {
          // fallback to token.sub if not found
          session.user.id = token.sub;
          session.user.role = 'user'; // Default role
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        const client = await clientPromise;
        const db = client.db();
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email: user.email.toLowerCase() });
        
        if (!existingUser) {
          // Create new user (role will be set later in the complete-registration flow)
          await db.collection('users').insertOne({
            email: user.email.toLowerCase(),
            name: user.name,
            image: user.image,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    }
  }
};

export default NextAuth(authOptions);
