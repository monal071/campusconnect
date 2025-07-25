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
    async jwt({ token, user, account }) {
      // Add role information to the JWT token
      if (user) {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection('users').findOne({ email: user.email.toLowerCase() });
        
        if (dbUser && dbUser.role) {
          token.role = dbUser.role;
        } else {
          // Don't set a default role - let the user select it in signup
          token.role = undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Always fetch the MongoDB user and set the correct _id as session.user.id
      if (session?.user?.email) {
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email: session.user.email.toLowerCase() });
        if (user && user._id) {
          session.user.id = user._id.toString();
          session.user.name = user.name;
          session.user.role = user.role; // Only add role if it exists in the database
        } else {
          // fallback to token.sub if not found
          session.user.id = token.sub;
          session.user.role = token.role; // Use role from token (might be undefined)
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('SignIn callback triggered for:', user.email);
        const client = await clientPromise;
        const db = client.db();
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email: user.email.toLowerCase() });
        
        if (!existingUser) {
          console.log('Creating new user:', user.email);
          // Create new user without a role (role will be set later in the signup flow)
          await db.collection('users').insertOne({
            email: user.email.toLowerCase(),
            name: user.name,
            image: user.image,
            // Don't set a role yet - let the signup page handle that
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log('New user created successfully without a role');
        } else {
          console.log('Existing user found:', existingUser.email, 'Role:', existingUser.role || 'No role');
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
