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
        timeout: 10000, // 10 seconds timeout instead of default 3.5s
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, account }) {
      // Add role information to the JWT token
      if (user) {
        try {
          const client = await Promise.race([
            clientPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
            )
          ]);
          
          const db = client.db();
          const dbUser = await Promise.race([
            db.collection('users').findOne({ email: user.email.toLowerCase() }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 2000)
            )
          ]);
          
          if (dbUser && dbUser.role) {
            token.role = dbUser.role;
          } else {
            // Don't set a default role - let the user select it in signup
            token.role = undefined;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          // Set role as undefined if database fails
          token.role = undefined;
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
            session.user.role = user.role; // Only add role if it exists in the database
          } else {
            // fallback to token.sub if not found
            session.user.id = token.sub;
            session.user.role = token.role; // Use role from token (might be undefined)
          }
        } catch (error) {
          console.error('Session callback error:', error);
          // Fallback to token data if database fails
          session.user.id = token.sub;
          session.user.role = token.role;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('SignIn callback triggered for:', user.email);
        
        // Add timeout to MongoDB operations
        const client = await Promise.race([
          clientPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
          )
        ]);
        
        const db = client.db();
        
        // Check if user exists with timeout
        const existingUser = await Promise.race([
          db.collection('users').findOne({ email: user.email.toLowerCase() }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), 3000)
          )
        ]);
        
        if (!existingUser) {
          console.log('Creating new user:', user.email);
          // Create new user without a role (role will be set later in the signup flow)
          await Promise.race([
            db.collection('users').insertOne({
              email: user.email.toLowerCase(),
              name: user.name,
              image: user.image,
              // Don't set a role yet - let the signup page handle that
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database insert timeout')), 3000)
            )
          ]);
          console.log('New user created successfully without a role');
        } else {
          console.log('Existing user found:', existingUser.email, 'Role:', existingUser.role || 'No role');
        }
        
        return true;
      } catch (error) {
        console.error('SignIn error:', error);
        // Don't fail the sign-in process for database errors
        // Allow the user to sign in and handle user creation later
        if (error.message.includes('timeout') || error.message.includes('MongoDB')) {
          console.log('Database operation failed, but allowing sign-in to continue');
          return true;
        }
        return false;
      }
    }
  }
};

export default NextAuth(authOptions);
