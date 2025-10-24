import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = (() => {
  try {
    return Redis.fromEnv();
  } catch (error) {
    console.error("Upstash Redis env vars missing:", error);
    return null;
  }
})();

const ratelimit =
  redis !== null
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "badux-submission",
      })
    : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method !== "POST") {
    return NextResponse.next();
  }

  // Only guard the main app routes; adjust if you add other POST endpoints.
  if (!pathname.startsWith("/")) {
    return NextResponse.next();
  }

  if (!ratelimit) {
    return NextResponse.next();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(
      `ip:${clientIp}`
    );

    if (!success) {
      return NextResponse.json(
        {
          error:
            "Too many requests. Please wait a moment before trying again.",
          limit,
          remaining,
          reset,
        },
        { status: 429, headers: { "Retry-After": Math.ceil(reset).toString() } }
      );
    }
  } catch (error) {
    console.error("Rate limit check failed:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
