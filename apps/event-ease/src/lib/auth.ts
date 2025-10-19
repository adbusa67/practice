import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type User = {
  id: string;
  [key: string]: any;
}

export type SessionResult = {
  response: NextResponse;
  user: User | null;
}

export type AuthDecision = {
  shouldRedirect: boolean;
  redirectTo?: string;
  allowAccess: boolean;
}

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (process.env.TEST_FORCE_AUTH) {
    response.headers.set('x-session-checked', 'true')
  }

  // For testing, allow environment variable to override authentication
  if (process.env.TEST_FORCE_AUTH === 'true') {
    response.cookies.set('sb-access-token', 'test-token', { httpOnly: true })
    return { response, user: { id: 'test-user' } as User }
  }
  if (process.env.TEST_FORCE_AUTH === 'false') {
    return { response, user: null }
  }

  // For development without Supabase, use simple mock authentication
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Check for mock auth cookie (for development)
    const mockAuthCookie = request.cookies.get('sb-access-token')
    const hasValidToken = mockAuthCookie?.value === 'mock-valid-token'
    const mockUser = hasValidToken ? { id: 'dev-user' } as User : null

    if (hasValidToken) {
      response.cookies.set('sb-access-token', 'mock-refreshed-token', { httpOnly: true })
      response.cookies.set('sb-refresh-token', 'mock-refresh-token', { httpOnly: true })
    }

    return { response, user: mockUser }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()
    return { response, user }
  } catch (error) {
    return { response, user: null }
  }
}

export function makeAuthDecision(pathname: string, isAuthenticated: boolean): AuthDecision {
  if (pathname === '/error') {
    return { shouldRedirect: false, allowAccess: true }
  }

  if (isAuthenticated) {
    if (pathname === '/' || pathname === '/login') {
      return { shouldRedirect: true, redirectTo: '/events', allowAccess: false }
    }
    return { shouldRedirect: false, allowAccess: true }
  }

  if (pathname === '/login') {
    return { shouldRedirect: false, allowAccess: true }
  }

  return { shouldRedirect: true, redirectTo: '/login', allowAccess: false }
}
