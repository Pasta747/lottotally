import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sql } from '@vercel/postgres';

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.id = user.id || user.email;
      if (account?.provider) token.provider = account.provider;
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image) token.picture = user.image;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.provider = token.provider || 'google';
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Auto-provision user record on login
      if (user?.email) {
        try {
          const userId = user.id || user.email;
          await sql`
            INSERT INTO users (id, email, name)
            VALUES (${userId}, ${user.email}, ${user.name || user.email.split('@')[0]})
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name
          `;
        } catch (error) {
          console.error('User provisioning error:', error);
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      const appBase = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://app.yourvantage.ai';
      if (url.includes('/dashboard')) return `${appBase}/dashboard`;
      if (url.includes('/onboarding')) return `${appBase}/onboarding`;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return url;
    },
  },
  pages: {
    signIn: '/signup',
  },
  session: { strategy: 'jwt' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };