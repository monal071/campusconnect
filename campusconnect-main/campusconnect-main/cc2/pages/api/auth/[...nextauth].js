import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from '../../../utils/mongodb';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  session: {
    strategy: "jwt",
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
        } else {
          // fallback to token.sub if not found
          session.user.id = token.sub;
        }
      }
      return session;
    }
  }
});
