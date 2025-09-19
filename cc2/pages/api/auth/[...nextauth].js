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
      },
      httpOptions: {
        timeout: 20000, // 20 seconds timeout
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('SignIn callback for:', user.email);
        
        // Add generous timeout for MongoDB operations
        const client = await Promise.race([
          clientPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
          )
        ]);
        
        const db = client.db();
        
        // Check if user exists with timeout
        const existingUser = await Promise.race([
          db.collection('users').findOne({ email: user.email.toLowerCase() }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          )
        ]);
        
        if (!existingUser) {
          // Create new user without role initially (will be set during signup flow)
          await Promise.race([
            db.collection('users').insertOne({
              email: user.email.toLowerCase(),
              name: user.name,
              image: user.image,
              connections: [],
              pendingRequests: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database insert timeout')), 5000)
            )
          ]);
          console.log('New user created:', user.email);
        } else {
          console.log('Existing user signed in:', user.email, 'Role:', existingUser.role);
        }
        
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        // Allow sign in even if database fails
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirects
      try {
        // If redirecting after sign-in, let the login page handle it
        if (url.includes('/login') || url === baseUrl) {
          return `${baseUrl}/login`;
        }
        
        // For other redirects, maintain the URL
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        
        // Default fallback
        return `${baseUrl}/login`;
      } catch (error) {
        console.error('Redirect error:', error);
        return `${baseUrl}/login`;
      }
    },
    async jwt({ token, user, account }) {
      // Add role information to the JWT token
      if (user || !token.role) {
        try {
          const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
            )
          ]);
          
          const db = client.db();
          const dbUser = await Promise.race([
            db.collection('users').findOne({ email: (user?.email || token.email)?.toLowerCase() }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 2000)
            )
          ]);
          
          if (dbUser) {
            token.role = dbUser.role || null;
            token.userId = dbUser._id.toString();
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          // Keep existing role if database fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Always fetch the MongoDB user and set the correct _id as session.user.id
      if (session?.user?.email) {
        try {
          const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
            )
          ]);
          
          const db = client.db();
          const user = await Promise.race([
            db.collection('users').findOne({ email: session.user.email.toLowerCase() }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 2000)
            )
          ]);
          
          if (user && user._id) {
            session.user.id = user._id.toString();
            session.user.name = user.name;
            session.user.role = user.role || null; // Include role from database
          } else {
            // fallback to token data if not found
            session.user.id = token.userId || token.sub;
            session.user.role = token.role || null;
          }
        } catch (error) {
          console.error('Session callback error:', error);
          // Fallback to token data if database fails
          session.user.id = token.userId || token.sub;
          session.user.role = token.role || null;
        }
      }
      return session;
    }
  }
};

export default NextAuth(authOptions);
