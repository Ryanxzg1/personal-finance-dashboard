import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/manifest.webmanifest',
  '/sw.js',
  '/icon-pwa.png'
])

// Basic in-memory rate limiting (Note: limited efficacy in distributed serverless env without Redis)
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // max 100 requests per minute

export const proxy = clerkMiddleware(async (auth, req) => {
  // 1. Handle Rate Limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    
    let rateData = rateLimitMap.get(ip);
    
    if (!rateData || (now - rateData.lastReset) > RATE_LIMIT_WINDOW) {
      rateData = { count: 1, lastReset: now };
      rateLimitMap.set(ip, rateData);
    } else {
      rateData.count++;
    }

    if (rateData.count > MAX_REQUESTS) {
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Handle CORS for API routes
    const response = NextResponse.next();
    const origin = req.headers.get('origin') ?? '';
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['https://your-domain.com'];

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    
    return response;
  }

  // 3. Default protection for other routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

export default proxy;
