/**
 * CORS and HTTP response helper utilities for Cloudflare Workers.
 */

/**
 * Returns standard CORS headers to permit cross-origin requests and Google Auth popups.
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Prodo-Client-Key",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  };
}

/**
 * Creates a JSON HTTP Response object with proper content-type and CORS headers.
 */
export function createJsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(),
    },
  });
}

/**
 * Creates a formatted JSON error response.
 */
export function createErrorResponse(message: string, status = 400): Response {
  return createJsonResponse({ success: false, message }, status);
}
