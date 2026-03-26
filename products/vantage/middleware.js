import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'mario@yourvantage.ai';

export default withAuth(
  function middleware(req) {
    const host = req.headers.get('host');
    const url = req.nextUrl.clone();
    const token = req.nextauth_token;

    // On app subdomain, avoid showing signup after auth.
    if (host && host.startsWith('app.') && (url.pathname === '/signup' || url.pathname === '/login')) {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Admin route protection — only Mario
    if (url.pathname.startsWith('/admin')) {
      if (!token?.email || token.email !== ADMIN_EMAIL) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/signup',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/config/:path*', '/onboarding/:path*', '/admin/:path*'],
};
