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
        let user = await env.DB.prepare("SELECT * FROM users WHERE email = ? OR google_id = ?")
          .bind(email, payload.sub || "")
          .first();

        let token = "";
        if (!user) {
          const username = (payload.name || email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
          token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          await env.DB.prepare("INSERT INTO users (username, email, google_id, xp, current_balance, auth_token) VALUES (?, ?, ?, 100, 100, ?)")
            .bind(username, email, payload.sub || "", token)
            .run();
          user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        } else {
          token = user.auth_token;
          if (!token) {
            token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
            await env.DB.prepare("UPDATE users SET auth_token = ? WHERE id = ?").bind(token, user.id).run();
          }
          if (!user.google_id && payload.sub) {
            await env.DB.prepare("UPDATE users SET google_id = ? WHERE id = ?").bind(payload.sub, user.id).run();
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            token: token,
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
      try {
        const body: any = await request.json();
        const email = (body.email || "").toLowerCase();
        const username = (body.username || "").toLowerCase();

        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? OR username = ?")
          .bind(email, username)
          .first();

        if (existing) {
          return new Response(
            JSON.stringify({ success: false, message: "Username or email already exists" }),
            { status: 400, headers: jsonHeader }
          );
        }

        const token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        await env.DB.prepare("INSERT INTO users (username, email, xp, current_balance, auth_token) VALUES (?, ?, 100, 100, ?)")
          .bind(username, email, token)
          .run();

        return new Response(
          JSON.stringify({ success: true, token, user: { username, email } }),
          { headers: jsonHeader }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    if (url.pathname === "/auth/login" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const email = (body.email || "").toLowerCase();

        let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        let token = "";

        if (!user) {
          const username = email.split("@")[0] || "operator";
          token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          await env.DB.prepare("INSERT INTO users (username, email, xp, current_balance, auth_token) VALUES (?, ?, 100, 100, ?)")
            .bind(username, email, token)
            .run();
          user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        } else {
          token = user.auth_token;
          if (!token) {
            token = "token_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
            await env.DB.prepare("UPDATE users SET auth_token = ? WHERE id = ?").bind(token, user.id).run();
          }
        }

        return new Response(
          JSON.stringify({ success: true, token, user: { username: user.username, email: user.email } }),
          { headers: jsonHeader }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    // ── User Profile & Sync ──────────────────────────────────────────────────
    if (url.pathname === "/users/me" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, message: "User not found" }),
            { status: 401, headers: jsonHeader }
          );
        }

        return new Response(
          JSON.stringify({
            username: user.username,
            email: user.email,
            total_lifetime_points: user.total_lifetime_points,
            current_balance: user.current_balance,
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

    if (url.pathname === "/users/sync" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, message: "User not found" }),
            { status: 401, headers: jsonHeader }
          );
        }

        const body: any = await request.json();
        const pointsEarned = Number(body.points_earned_since_last_sync || 0);
        const currentMultiplier = Number(body.current_multiplier || 1.0);
        const isCamOn = Boolean(body.is_cam_on);

        // Check active co-op sessions
        const coopCheck = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM coop_sessions WHERE (host_user_id = ? OR friend_user_id = ?) AND is_active = 1"
        ).bind(user.id, user.id).first();

        const inCoop = coopCheck ? (Number(coopCheck.count) > 0) : false;
        const multiplierBoost = (inCoop && isCamOn) ? 5.0 : 1.0;
        const addedPoints = Math.floor(pointsEarned * multiplierBoost);

        const newXp = (user.xp || 0) + addedPoints;
        const newLifetime = (user.total_lifetime_points || 0) + addedPoints;
        const newBalance = (user.current_balance || 0) + addedPoints;

        await env.DB.prepare(
          "UPDATE users SET xp = ?, total_lifetime_points = ?, current_balance = ?, current_multiplier = ? WHERE id = ?"
        ).bind(newXp, newLifetime, newBalance, currentMultiplier, user.id).run();

        return new Response(
          JSON.stringify({
            success: true,
            points_added: addedPoints,
            multiplier: currentMultiplier * multiplierBoost,
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

    // ── Friends ──────────────────────────────────────────────────────────────
    if (url.pathname === "/friends/list" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, message: "User not found" }),
            { status: 401, headers: jsonHeader }
          );
        }

        const { results } = await env.DB.prepare(`
          SELECT u.username, u.total_lifetime_points as points FROM friends f
          JOIN users u ON f.friend_id = u.id
          WHERE f.user_id = ?
        `).bind(user.id).all();

        return new Response(JSON.stringify({ success: true, friends: results }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    if (url.pathname === "/friends/add" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, message: "User not found" }),
            { status: 401, headers: jsonHeader }
          );
        }

        const body: any = await request.json();
        const friendUsername = String(body.username || "").trim().toLowerCase();
        const friend = await env.DB.prepare("SELECT * FROM users WHERE lower(username) = ?")
          .bind(friendUsername)
          .first();

        if (!friend) {
          return new Response(JSON.stringify({ success: false, message: "Username not found" }), {
            status: 404,
            headers: jsonHeader,
          });
        }

        if (friend.id === user.id) {
          return new Response(JSON.stringify({ success: false, message: "You cannot add yourself" }), {
            status: 400,
            headers: jsonHeader,
          });
        }

        await env.DB.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)")
          .bind(user.id, friend.id)
          .run();
        await env.DB.prepare("INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)")
          .bind(friend.id, user.id)
          .run();

        return new Response(JSON.stringify({ success: true, message: "Friend added successfully" }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    // ── Leaderboards ─────────────────────────────────────────────────────────
    if (url.pathname === "/leaderboard/global" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT username, total_lifetime_points as points FROM users ORDER BY points DESC LIMIT 10"
        ).all();

        const leaderboard = results.map((row: any, index: number) => ({
          username: row.username,
          points: Number(row.points || 0),
          rank: index + 1,
        }));

        return new Response(JSON.stringify({ success: true, leaderboard }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    if (url.pathname === "/leaderboard/friends" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, message: "User not found" }),
            { status: 401, headers: jsonHeader }
          );
        }

        const { results } = await env.DB.prepare(`
          SELECT username, total_lifetime_points as points FROM users WHERE id = ?
          UNION
          SELECT u.username, u.total_lifetime_points as points FROM friends f
          JOIN users u ON f.friend_id = u.id
          WHERE f.user_id = ?
          ORDER BY points DESC
        `).bind(user.id, user.id).all();

        const leaderboard = results.map((row: any, index: number) => ({
          username: row.username,
          points: Number(row.points || 0),
          rank: index + 1,
        }));

        return new Response(JSON.stringify({ success: true, leaderboard }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    // ── Co-Op Rooms ───────────────────────────────────────────────────────────
    if (url.pathname === "/coop/create" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
            status: 401,
            headers: jsonHeader,
          });
        }

        const body: any = await request.json();
        let friendUserId: number | null = null;
        if (body.friend_username) {
          const friendUsername = String(body.friend_username).trim().toLowerCase();
          const friend = await env.DB.prepare("SELECT id FROM users WHERE lower(username) = ?")
            .bind(friendUsername)
            .first();
          if (friend) {
            friendUserId = Number(friend.id);
          }
        }

        const sessionId = `coop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await env.DB.prepare(
          "INSERT INTO coop_sessions (session_id, host_user_id, friend_user_id, is_active, started_at) VALUES (?, ?, ?, 1, ?)"
        ).bind(sessionId, user.id, friendUserId, Date.now() / 1000).run();

        return new Response(JSON.stringify({ success: true, session_id: sessionId }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    if (url.pathname === "/coop/active" && request.method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
            status: 401,
            headers: jsonHeader,
          });
        }

        const { results } = await env.DB.prepare(`
          SELECT cs.session_id, u.username as host_username, cs.started_at FROM coop_sessions cs
          JOIN users u ON cs.host_user_id = u.id
          WHERE cs.is_active = 1 AND cs.host_user_id != ?
            AND (cs.friend_user_id IS NULL OR cs.friend_user_id = ?)
        `).bind(user.id, user.id).all();

        return new Response(JSON.stringify({ success: true, rooms: results }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    if (url.pathname === "/coop/join" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
            status: 401,
            headers: jsonHeader,
          });
        }

        const body: any = await request.json();
        const sessionId = String(body.session_id || "");
        const room = await env.DB.prepare("SELECT * FROM coop_sessions WHERE session_id = ? AND is_active = 1")
          .bind(sessionId)
          .first();

        if (!room) {
          return new Response(JSON.stringify({ success: false, message: "Active Co-Op session not found" }), {
            status: 404,
            headers: jsonHeader,
          });
        }

        if (!room.friend_user_id) {
          await env.DB.prepare("UPDATE coop_sessions SET friend_user_id = ? WHERE session_id = ?")
            .bind(user.id, sessionId)
            .run();
        }

        return new Response(JSON.stringify({ success: true, message: "Joined Co-Op focus room" }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    if (url.pathname === "/coop/end" && request.method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        const user = await env.DB.prepare("SELECT * FROM users WHERE auth_token = ?").bind(token).first();
        if (!user) {
          return new Response(JSON.stringify({ success: false, message: "Authentication required" }), {
            status: 401,
            headers: jsonHeader,
          });
        }

        const body: any = await request.json();
        const sessionId = String(body.session_id || "");
        await env.DB.prepare("UPDATE coop_sessions SET is_active = 0 WHERE session_id = ? AND host_user_id = ?")
          .bind(sessionId, user.id)
          .run();

        return new Response(JSON.stringify({ success: true, message: "Co-Op session ended" }), { headers: jsonHeader });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: jsonHeader }
        );
      }
    }

    // Default Fallback
    return new Response(
      JSON.stringify({ success: true, message: "Prodo API Active", path: url.pathname }),
      { headers: jsonHeader }
    );
  },
};
