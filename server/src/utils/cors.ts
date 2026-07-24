/**
 * CORS and HTTP response helper utilities for Cloudflare Workers.
 */

/**
 * Returns standard CORS headers to permit cross-origin requests and Google Auth popups.
 */
export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request ? (request.headers.get("Origin") || "*") : "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Prodo-Client-Key, X-Prodo-CV-Key",
    "Access-Control-Max-Age": "86400",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  };
}

/**
 * Creates a JSON HTTP Response object with proper content-type and CORS headers.
 */
export function createJsonResponse(data: any, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(request),
    },
  });
}

/**
 * Creates a formatted JSON error response.
 */
export function createErrorResponse(message: string, status = 400, request?: Request): Response {
  return createJsonResponse({ success: false, message }, status, request);
}

