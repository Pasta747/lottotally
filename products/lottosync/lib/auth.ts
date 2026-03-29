import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql, type User } from "@/lib/db"; // Use Vercel Postgres client

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const normalizedEmail = credentials.email.toLowerCase();
          const userResult = await sql`SELECT * FROM lt_users WHERE email = ${normalizedEmail}`;
          const user = userResult[0] as User | undefined;

          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) return null;

          return {
            id: String(user.id),
            email: user.email,
            name: user.store_name || user.email,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Validate user still exists in DB on every request
        const userId = String(token.id);
        const userResult = await sql`SELECT id, email FROM lt_users WHERE id = ${Number(userId)} LIMIT 1`;
        if (userResult.length === 0) {
          // User was deleted — return a dummy session that will fail auth
          session.user.id = "-1";
          session.user.email = "deleted@invalid";
        } else {
          session.user.id = userId;
          session.user.email = userResult[0].email;
        }
      }
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions);
}