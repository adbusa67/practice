import { type NextRequest, NextResponse } from "next/server";
import { updateSession, makeAuthDecision } from "./lib/auth";

const PERMANENT_REDIRECT = 308 as const

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { response, user } = await updateSession(request)
  const isAuthenticated = !!user

  const decision = makeAuthDecision(pathname, isAuthenticated)

  if (!decision.shouldRedirect) {
    return response
  }

  const redirectResponse = NextResponse.redirect(new URL(decision.redirectTo!, request.url), { status: PERMANENT_REDIRECT })
  if (process.env.TEST_FORCE_AUTH) {
    redirectResponse.headers.set('x-session-checked', 'true')
  }

  // Copy session cookies to redirect response
  response.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return redirectResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
