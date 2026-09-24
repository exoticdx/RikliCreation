import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. IP Allowlisting Check (Applies to both admin and login)
  if (path.startsWith('/riklicreationadminpafe2021222324') || path.startsWith('/riklicreationloginpafe2021222324')) {
    const allowedIps = process.env.ALLOWED_IPS;
    
    if (allowedIps) {
      // Get the client IP. Fallbacks are for local dev and different proxy setups.
      let clientIp = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip');
      
      // x-forwarded-for can be a comma-separated list of IPs. Get the first one.
      if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
      }

      // If we found an IP and it's not in the allowed list, redirect to Home
      if (clientIp) {
        const ipList = allowedIps.split(',').map(ip => ip.trim());
        if (!ipList.includes(clientIp)) {
          console.log(`Blocked access from unauthorized IP: ${clientIp}`);
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  }

  // 2. Auth Cookie Check (Applies only to admin)
  if (path.startsWith('/riklicreationadminpafe2021222324')) {
    const adminSession = request.cookies.get('admin_session');

    // If there is no session, redirect to the login page (or homepage to be stealthy)
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Otherwise, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Run middleware on admin routes and login route
  matcher: ['/riklicreationadminpafe2021222324/:path*', '/riklicreationadminpafe2021222324', '/riklicreationloginpafe2021222324'],
};
