import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const host = req.headers.get('host');
    const url = req.nextUrl.clone();

    // On app subdomain, avoid showing signup after auth.
    if (host && host.startsWith('app.') && (url.pathname === '/signup' || url.pathname === '/login')) {
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
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
  matcher: ['/dashboard/:path*', '/config/:path*', '/onboarding/:path*'],
};
