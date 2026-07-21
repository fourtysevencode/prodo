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
const mockFriendsByToken: Record<string, string[]> = {};
const mockCoopRooms: Record<string, {
  session_id: string;
  host_username: string;
  friend_username: string | null;
  started_at: number;
  is_active: boolean;
}> = {};

function getBearerToken(request: Request): string {
  return (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function getCurrentUser(request: Request) {
  const token = getBearerToken(request);
  return { token, user: mockUsersByToken[token] || null };
}

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
          mockFriendsByToken[token] = [];
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
      mockFriendsByToken[token] = [];

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
        mockFriendsByToken[token] = [];
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

    // ── Friends ──────────────────────────────────────────────────────────────
    if (url.pathname === "/friends/list" && request.method === "GET") {
      const { token, user } = getCurrentUser(request);
      if (!user) {
        return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
          status: 401,
          headers: jsonHeader,
        });
      }

      const friendUsernames = mockFriendsByToken[token] || [];
      const friends = friendUsernames
        .map((username) => Object.values(mockUsersByEmail).find((candidate) => candidate.username === username))
        .filter((friend): friend is NonNullable<typeof friend> => Boolean(friend))
        .map((friend) => ({ username: friend.username, points: friend.points }));

      return new Response(JSON.stringify({ success: true, friends }), { headers: jsonHeader });
    }

    if (url.pathname === "/friends/add" && request.method === "POST") {
      const { token, user } = getCurrentUser(request);
      if (!user) {
        return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
          status: 401,
          headers: jsonHeader,
        });
      }

      const body: any = await request.json();
      const username = String(body.username || "").trim().toLowerCase();
      const friend = Object.values(mockUsersByEmail).find((candidate) => candidate.username === username);
      if (!friend) {
        return new Response(JSON.stringify({ success: false, message: "Username not found" }), {
          status: 404,
          headers: jsonHeader,
        });
      }
      if (friend.token === token) {
        return new Response(JSON.stringify({ success: false, message: "You cannot add yourself" }), {
          status: 400,
          headers: jsonHeader,
        });
      }

      const currentFriends = mockFriendsByToken[token] || (mockFriendsByToken[token] = []);
      if (!currentFriends.includes(friend.username)) currentFriends.push(friend.username);
      const friendFriends = mockFriendsByToken[friend.token] || (mockFriendsByToken[friend.token] = []);
      if (!friendFriends.includes(user.username)) friendFriends.push(user.username);

      return new Response(JSON.stringify({ success: true, message: "Friend added" }), { headers: jsonHeader });
    }

    // ── Leaderboards ─────────────────────────────────────────────────────────
    if (url.pathname === "/leaderboard/global") {
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

    if (url.pathname === "/leaderboard/friends" && request.method === "GET") {
      const { token } = getCurrentUser(request);
      const friendUsernames = mockFriendsByToken[token] || [];
      const usernames = [mockUsersByToken[token]?.username, ...friendUsernames].filter(
        (username): username is string => Boolean(username)
      );
      const leaderboard = usernames
        .map((username) => Object.values(mockUsersByEmail).find((candidate) => candidate.username === username))
        .filter((user): user is NonNullable<typeof user> => Boolean(user))
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({ username: user.username, points: user.points, rank: index + 1 }));

      return new Response(JSON.stringify({ success: true, leaderboard }), { headers: jsonHeader });
    }

    // ── Co-Op Rooms ───────────────────────────────────────────────────────────
    if (url.pathname === "/coop/create" && request.method === "POST") {
      const { user } = getCurrentUser(request);
      if (!user) {
        return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
          status: 401,
          headers: jsonHeader,
        });
      }

      const body: any = await request.json();
      const friendUsername = body.friend_username ? String(body.friend_username).trim().toLowerCase() : null;
      const session_id = `coop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      mockCoopRooms[session_id] = {
        session_id,
        host_username: user.username,
        friend_username: friendUsername,
        started_at: Date.now() / 1000,
        is_active: true,
      };

      return new Response(JSON.stringify({ success: true, session_id }), { headers: jsonHeader });
    }

    if (url.pathname === "/coop/active" && request.method === "GET") {
      const { user } = getCurrentUser(request);
      if (!user) {
        return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
          status: 401,
          headers: jsonHeader,
        });
      }

      const rooms = Object.values(mockCoopRooms)
        .filter((room) => room.is_active && room.host_username !== user.username)
        .filter((room) => !room.friend_username || room.friend_username === user.username)
        .map(({ session_id, host_username, started_at }) => ({ session_id, host_username, started_at }));

      return new Response(JSON.stringify({ success: true, rooms }), { headers: jsonHeader });
    }

    if (url.pathname === "/coop/join" && request.method === "POST") {
      const { user } = getCurrentUser(request);
      const body: any = await request.json();
      const room = mockCoopRooms[String(body.session_id || "")];
      if (!user || !room || !room.is_active) {
        return new Response(JSON.stringify({ success: false, message: "Active Co-Op session not found" }), {
          status: 404,
          headers: jsonHeader,
        });
      }
      if (!room.friend_username) room.friend_username = user.username;
      return new Response(JSON.stringify({ success: true, message: "Joined Co-Op focus room" }), { headers: jsonHeader });
    }

    if (url.pathname === "/coop/end" && request.method === "POST") {
      const { user } = getCurrentUser(request);
      const body: any = await request.json();
      const room = mockCoopRooms[String(body.session_id || "")];
      if (!user || !room || room.host_username !== user.username) {
        return new Response(JSON.stringify({ success: false, message: "Co-Op session not found" }), {
          status: 404,
          headers: jsonHeader,
        });
      }
      room.is_active = false;
      return new Response(JSON.stringify({ success: true, message: "Co-Op session ended" }), { headers: jsonHeader });
    }

    // Default Fallback
    return new Response(
      JSON.stringify({ success: true, message: "Prodo API Active", path: url.pathname }),
      { headers: jsonHeader }
    );
  },
};
