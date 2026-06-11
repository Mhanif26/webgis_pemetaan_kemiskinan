import type { CookieOptions } from "hono/utils/cookie";

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);
  const protocol = headers.get("x-forwarded-proto") || "";
  const isHttps = protocol === "https";

  return {
    httpOnly: true,
    path: "/",
    sameSite: (localhost || !isHttps) ? "Lax" : "None",
    secure: !localhost && isHttps,
  };
}
