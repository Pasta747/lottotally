import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';

const providers = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (credentials?.email && credentials?.password) {
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email.split('@')[0],
          loginMethod: 'credentials',
        };
      }
      return null;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      if (account?.provider) token.provider = account.provider;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.provider = token.provider || 'credentials';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Prefer app subdomain for authenticated app surfaces.
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
