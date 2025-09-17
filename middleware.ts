import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Define protected routes
        const protectedRoutes = [
          "/dashboard",
          "/chat",
          "/profile",
          "/api/chat",
          "/api/user"
        ]
        
        // Define public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/auth/signin",
          "/auth/signup",
          "/api/auth/register"
        ]
        
        // Check if the route is public
        const isPublicRoute = publicRoutes.some(route => 
          pathname === route || pathname.startsWith("/api/auth/")
        )
        
        // If it's a public route, allow access
        if (isPublicRoute) {
          return true
        }
        
        // Check if the route is protected
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname.startsWith(route)
        )
        
        // For protected routes, require authentication
        if (isProtectedRoute) {
          return !!token
        }
        
        // Allow access to other routes
        return true
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
)

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}