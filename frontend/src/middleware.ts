import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This is a mock middleware setup for the frontend
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public paths that do not require authentication
  const isPublicPath = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/'

  // Simulating token check (In real implementation, we will check JWT token in cookie)
  // For now we assume no token means not logged in
  // const token = request.cookies.get('token')?.value || ''
  
  // To allow you to preview UI without backend, we bypass the actual redirect logic for now by returning 
  // If you want to test route protection, set isDevelopmentMode to false
  const isDevelopmentMode = true 

  if (!isDevelopmentMode) {
    const hasToken = false // assume not authenticated
    
    if (!hasToken && !isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (hasToken && isPublicPath) {
      // Logic to redirect already logged-in user away from login page
      // Normally we'd decode the JWT to check role and route them
      return NextResponse.redirect(new URL('/admin/dashboard', request.url)) // Admin default
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
