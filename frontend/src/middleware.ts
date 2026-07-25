import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// These are the routes that require authentication
const protectedRoutes = ['/dashboard', '/chat', '/library', '/history', '/settings']

export function middleware(request: NextRequest) {
  // In a real implementation with Supabase Auth, you would check for the
  // 'sb-[your-project-ref]-auth-token' cookie here, or use the Supabase SSR package.
  // Since we haven't configured the SSR package yet, we will just do a basic check
  // or let the client-side handle the redirect if they are not logged in.
  
  // For now, to allow the user to see the UI without providing real keys, 
  // we'll bypass the strict middleware redirect until keys are added.
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
