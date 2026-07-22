import { GoogleTokenPayload } from "../types";

/**
 * Decodes a Google OAuth JWT ID token credential string without external crypto dependencies.
 * 
 * Logic Explanation:
 * 1. A JWT consists of 3 dot-separated base64url parts: header.payload.signature
 * 2. We extract part [1] (the payload), convert base64url characters (- into +, _ into /) to standard base64.
 * 3. We decode the base64 string into a UTF-8 JSON string using `atob` and URI component decoding.
 * 4. Parse and return the payload object containing `email`, `name`, and `sub` (Google User ID).
 */
export function decodeGoogleToken(credential: string): GoogleTokenPayload | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;

    // Convert base64url to standard base64 format
    const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    
    // Decode base64 bytes to UTF-8 percent-encoded string
    const jsonString = decodeURIComponent(
      atob(base64Payload)
        .split("")
        .map((character) => "%" + ("00" + character.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonString) as GoogleTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts Bearer token from the incoming HTTP Request Authorization header.
 */
export function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get("Authorization") || "";
  return authHeader.replace(/^Bearer\s+/i, "").trim();
}

/**
 * Generates a cryptographically secure random token string using Web Crypto CSPRNG.
 */
export function generateSecureToken(prefix = "token_", length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}${hex}`;
}
