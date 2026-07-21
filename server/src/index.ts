function decodeGoogleToken(credential: string): any {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// In-memory worker state for user sessions
const mockUsersByToken: Record<string, { username: string; email: string; points: number; balance: number }> = {};
const mockUsersByEmail: Record<string, { username: string; email: string; token: string; points: number; balance: number }> = {};

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Prodo-Client-Key",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const jsonHeader = { "Content-Type": "application/json", ...corsHeaders };

    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "prodo-api-worker" }), {
        headers: jsonHeader,
      });
    }

    // ── Google Auth ──────────────────────────────────────────────────────────
    if (url.pathname === "/auth/google" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const payload = decodeGoogleToken(body.credential || "");
        if (!payload || !payload.email) {
          return new Response(
            JSON.stringify({ success: false, message: "Invalid Google credential" }),
            { status: 400, headers: jsonHeader }
          );
        }

        const email = payload.email.toLowerCase();
        let user = mockUsersByEmail[email];

        if (!user) {
          const username = (payload.name || email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
          const token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          user = { username, email, token, points: 100, balance: 100 };
          mockUsersByEmail[email] = user;
          mockUsersByToken[token] = user;
        }

        return new Response(
          JSON.stringify({
            success: true,
            token: user.token,
            user: { username: user.username, email: user.email },
          }),
          { headers: jsonHeader }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    // ── Standard Login & Register ───────────────────────────────────────────
    if (url.pathname === "/auth/register" && request.method === "POST") {
      const body: any = await request.json();
      const email = (body.email || "").toLowerCase();
      const username = (body.username || "").toLowerCase();
      const token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);

      const user = { username, email, token, points: 0, balance: 0 };
      mockUsersByEmail[email] = user;
      mockUsersByToken[token] = user;

      return new Response(
        JSON.stringify({ success: true, token, user: { username, email } }),
        { headers: jsonHeader }
      );
    }

    if (url.pathname === "/auth/login" && request.method === "POST") {
      const body: any = await request.json();
      const email = (body.email || "").toLowerCase();
      let user = mockUsersByEmail[email];

      if (!user) {
        const username = email.split("@")[0] || "operator";
        const token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        user = { username, email, token, points: 100, balance: 100 };
        mockUsersByEmail[email] = user;
        mockUsersByToken[token] = user;
      }

      return new Response(
        JSON.stringify({ success: true, token: user.token, user: { username: user.username, email: user.email } }),
        { headers: jsonHeader }
      );
    }

    // ── User Profile & Sync ──────────────────────────────────────────────────
    if (url.pathname === "/users/me" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "").trim();
      const user = mockUsersByToken[token] || { username: "operator", email: "user@prodo.live", points: 150, balance: 150 };

      return new Response(
        JSON.stringify({
          username: user.username,
          email: user.email,
          total_lifetime_points: user.points,
          current_balance: user.balance,
        }),
        { headers: jsonHeader }
      );
    }

    if (url.pathname === "/users/sync" && request.method === "POST") {
      return new Response(
        JSON.stringify({ success: true, points_added: 10, multiplier: 1.0 }),
        { headers: jsonHeader }
      );
    }

    // ── Leaderboards ─────────────────────────────────────────────────────────
    if (url.pathname === "/leaderboard/global" || url.pathname === "/leaderboard/friends") {
      return new Response(
        JSON.stringify({
          success: true,
          leaderboard: [
            { username: "ivan", points: 1250, rank: 1 },
            { username: "ronak", points: 980, rank: 2 },
            { username: "ritish", points: 840, rank: 3 },
          ],
        }),
        { headers: jsonHeader }
      );
    }

    // Default Fallback
    return new Response(
      JSON.stringify({ success: true, message: "Prodo API Active", path: url.pathname }),
      { headers: jsonHeader }
    );
  },
};
