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
        
        if (dbUser) {
          // Add user properties to token
          token.role = dbUser.role || 'user';
          token.isRegistered = dbUser.isRegistered !== false; // true unless explicitly set to false
          token.userId = dbUser._id.toString();
        } else {
          // Default values if user is not found
          token.role = 'user';
          token.isRegistered = false;
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
          // Set user properties from database
          session.user.id = user._id.toString();
          session.user.name = user.name;
          session.user.role = user.role || 'user';
          session.user.isRegistered = user.isRegistered !== false; // true unless explicitly set to false
        } else {
          // Fallback to token values
          session.user.id = token.userId || token.sub;
          session.user.role = token.role || 'user';
          session.user.isRegistered = token.isRegistered || false;
        }
        
        // Log session for debugging
        console.log(`Session for ${session.user.email}:`, {
          role: session.user.role,
          isRegistered: session.user.isRegistered,
          id: session.user.id
        });
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        const client = await clientPromise;
        const db = client.db();
        
        // Check if user exists in our database
        const existingUser = await db.collection('users').findOne({ email: user.email.toLowerCase() });
        
        if (!existingUser) {
          // If this is a Google sign-in, add the user to the database as a new signup
          if (account.provider === 'google') {
            // Create new user with isRegistered = false to indicate they need to complete signup
            await db.collection('users').insertOne({
              email: user.email.toLowerCase(),
              name: user.name,
              image: user.image,
              isRegistered: false, // Flag to indicate signup is not complete
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            
            // Return true to allow sign-in - we'll handle redirection in the callback
            return true;
          }
          
          // For other providers or if implementation changes, deny access
          console.log(`User ${user.email} tried to sign in but is not registered`);
          return false; // This will trigger the error page
        }
        
        // If the user exists but hasn't completed registration
        if (existingUser && existingUser.isRegistered === false) {
          console.log(`User ${user.email} exists but needs to complete registration`);
          return true; // Allow sign-in but we'll check registration status on client side
        }
        
        // User exists and is fully registered, allow sign-in
        console.log(`User ${user.email} is registered, allowing sign-in`);
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        return false;
      }
    }
  }
};

export default NextAuth(authOptions);
