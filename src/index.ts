// src/index.ts

interface Env {
  DISCORD_CLIENT_SECRET: string;
  SESSIONS: KVNamespace;
  DB: D1Database; // 追加
  ASSETS: Fetcher;
}

type Session = { id: string; username: string; roles: string[] };

const DISCORD_API = "https://discord.com/api";
const SELF_ORIGIN = "https://cassrworker.aethel-bassist.workers.dev";
const CLIENT_ID = "1552100573283876935";
const GUILD_ID = "1137932995525877841";
const DRIVER_ROLE_ID = "1170176484917379143"; // ← 運転士ロールのIDに合わせて確認してください
const SENDER_ROLE_ID = "1138658687737667674";
const SESSION_TTL = 60 * 60 * 24 * 7;
const NOTICE_TYPES = ["speed_restriction", "suspension", "inhibit", "construction", "track_change"];

// ---------- 共通関数 ----------
function getCookie(request: Request, name: string): string | null {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

async function getSession(request: Request, env: Env): Promise<Session | null> {
  const sid = getCookie(request, "session");
  if (!sid) return null;
  const data = await env.SESSIONS.get(sid);
  return data ? (JSON.parse(data) as Session) : null;
}

const canSend = (s: Session) => s.roles.includes(SENDER_ROLE_ID);
const json = (data: unknown, status = 200) => Response.json(data, { status });

// 日時はUTCのISO形式にそろえる(文字列比較で正しく判定するため)
function toIso(v?: string | null): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new Error("日時が不正です");
  return d.toISOString();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ---------- ログイン ----------
    if (path === "/login") {
      const state = crypto.randomUUID();
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: `${SELF_ORIGIN}/callback`,
        response_type: "code",
        scope: "identify guilds.members.read",
        state,
      });
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${DISCORD_API}/oauth2/authorize?${params}`,
          "Set-Cookie": `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (path === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code) return new Response("code がありません", { status: 400 });
      if (!state || state !== getCookie(request, "oauth_state")) {
        return new Response("不正なリクエストです", { status: 400 });
      }

      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${SELF_ORIGIN}/callback`,
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token) return new Response("トークン取得失敗", { status: 400 });

      const memberRes = await fetch(`${DISCORD_API}/users/@me/guilds/${GUILD_ID}/member`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!memberRes.ok) return new Response("サーバーに参加していません", { status: 403 });
      const member = (await memberRes.json()) as {
        roles?: string[];
        nick?: string | null;
        user: { id: string; username: string; global_name?: string | null };
      };

      // 運転士か送信役のどちらかのロールがあればログインできる
      const roles = member.roles ?? [];
      const isDriver = roles.includes(DRIVER_ROLE_ID);
      if (!isDriver && !roles.includes(SENDER_ROLE_ID)) {
        return new Response("権限がありません", { status: 403 });
      }

      const displayName = member.nick || member.user.global_name || member.user.username;
      await env.DB.prepare(
        `INSERT INTO users (discord_id, username, last_login, is_driver) VALUES (?, ?, ?, ?)
         ON CONFLICT(discord_id) DO UPDATE SET
           username = excluded.username,
           last_login = excluded.last_login,
           is_driver = excluded.is_driver`
      ).bind(member.user.id, displayName, new Date().toISOString(), isDriver ? 1 : 0).run();

      const sessionId = crypto.randomUUID();
      await env.SESSIONS.put(
        sessionId,
        JSON.stringify({ id: member.user.id, username: displayName, roles }),
        { expirationTtl: SESSION_TTL }
      );

      const headers = new Headers({ Location: SELF_ORIGIN + "/" });
      headers.append("Set-Cookie", `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`);
      headers.append("Set-Cookie", "oauth_state=; Path=/; Max-Age=0");
      return new Response(null, { status: 302, headers });
    }

    if (path === "/logout") {
      const sid = getCookie(request, "session");
      if (sid) await env.SESSIONS.delete(sid);
      return new Response(null, {
        status: 302,
        headers: {
          Location: SELF_ORIGIN + "/",
          "Set-Cookie": "session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      });
    }

    if (path === "/me") {
      const session = await getSession(request, env);
      if (!session) return json({ loggedIn: false }, 401);
      return json({ loggedIn: true, user: session, canSend: canSend(session) });
    }

    // ---------- 通告API ----------
    if (path.startsWith("/api/")) {
      const session = await getSession(request, env);
      if (!session) return json({ error: "ログインが必要です" }, 401);

      // 取得以外(POST/PATCH)は同一オリジンからのみ受け付ける
      if (request.method !== "GET" && request.headers.get("Origin") !== SELF_ORIGIN) {
        return json({ error: "不正なOriginです" }, 403);
      }

      // 宛先候補(運転士のみ、送信役だけが見られる)
      if (path === "/api/users" && request.method === "GET") {
        if (!canSend(session)) return json({ error: "権限がありません" }, 403);
        const { results } = await env.DB.prepare(
          "SELECT discord_id, username FROM users WHERE is_driver = 1 ORDER BY username"
        ).all();
        return json(results);
      }

      // 通告の送信
      if (path === "/api/notices" && request.method === "POST") {
        if (!canSend(session)) return json({ error: "権限がありません" }, 403);

        const b = await request.json<any>().catch(() => null);
        if (!b || !NOTICE_TYPES.includes(b.type) || typeof b.payload !== "object" || b.payload === null) {
          return json({ error: "入力が不正です" }, 400);
        }

        let validFrom: string | null, validUntil: string | null;
        try {
          validFrom = toIso(b.validFrom);
          validUntil = toIso(b.validUntil);
        } catch (e) {
          return json({ error: (e as Error).message }, 400);
        }

        // 宛先が空なら全員宛て
        const recipients: string[] = [...new Set<string>((b.recipients ?? []).map(String))];
        if (recipients.length > 0) {
          const marks = recipients.map(() => "?").join(",");
          const { results } = await env.DB.prepare(
            `SELECT discord_id FROM users WHERE is_driver = 1 AND discord_id IN (${marks})`
          ).bind(...recipients).all();
          if (results.length !== recipients.length) {
            return json({ error: "不明な宛先が含まれています" }, 400);
          }
        }

        const id = crypto.randomUUID();
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO notices (id, type, line, from_station, to_station, payload, memo,
               valid_from, valid_until, issued_by, issued_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id, b.type, b.line ?? null, b.from ?? null, b.to ?? null,
            JSON.stringify(b.payload), b.memo ?? null,
            validFrom, validUntil, session.id, new Date().toISOString()
          ),
          ...recipients.map((uid) =>
            env.DB.prepare("INSERT INTO notice_recipients (notice_id, discord_id) VALUES (?, ?)").bind(id, uid)
          ),
        ]);
        return json({ id }, 201);
      }

      // 送信済み一覧(送信役のみ)
      if (path === "/api/notices/issued" && request.method === "GET") {
        if (!canSend(session)) return json({ error: "権限がありません" }, 403);
        const { results } = await env.DB.prepare(
          `SELECT n.*,
   (SELECT group_concat(r.discord_id) FROM notice_recipients r WHERE r.notice_id = n.id) AS recipients,
   (SELECT count(*) FROM notice_acks a WHERE a.notice_id = n.id) AS ack_count
 FROM notices n ORDER BY n.issued_at DESC LIMIT 100`
        ).all<any>();
        return json(results.map((r) => ({
          ...r,
          payload: JSON.parse(r.payload),
          recipients: r.recipients ? String(r.recipients).split(",") : [],
        })));
      }

      // 通告の取り消し(送信役のみ)
      const m = path.match(/^\/api\/notices\/([\w-]+)$/);
      if (m && request.method === "PATCH") {
        if (!canSend(session)) return json({ error: "権限がありません" }, 403);
        const r = await env.DB.prepare("UPDATE notices SET status = 'cancelled' WHERE id = ?")
          .bind(m[1]).run();
        if (!r.meta.changes) return json({ error: "通告が見つかりません" }, 404);
        return json({ ok: true });
      }

      // 自分宛ての有効な通告(CAS-SRが取得する)
      if (path === "/api/notices" && request.method === "GET") {
        const now = new Date().toISOString();
        const { results } = await env.DB.prepare(
          `SELECT n.*,
          EXISTS (SELECT 1 FROM notice_acks a WHERE a.notice_id = n.id AND a.discord_id = ?2) AS acked
          FROM notices n
           WHERE n.status = 'active'
             AND (n.valid_from IS NULL OR n.valid_from <= ?1)
             AND (n.valid_until IS NULL OR n.valid_until > ?1)
             AND (
               NOT EXISTS (SELECT 1 FROM notice_recipients r WHERE r.notice_id = n.id)
               OR EXISTS (SELECT 1 FROM notice_recipients r
                          WHERE r.notice_id = n.id AND r.discord_id = ?2)
             )
           ORDER BY n.issued_at DESC`
        ).bind(now, session.id).all<any>();
        return json(results.map((r) => ({ ...r, payload: JSON.parse(r.payload) })));
      }
      // 通告の確認(運転士が自分宛ての通告を確認済みにする)
const ack = path.match(/^\/api\/notices\/([\w-]+)\/ack$/);
if (ack && request.method === "POST") {
  const ok = await env.DB.prepare(
    `SELECT 1 FROM notices n
     WHERE n.id = ?1 AND n.status = 'active'
       AND (
         NOT EXISTS (SELECT 1 FROM notice_recipients r WHERE r.notice_id = n.id)
         OR EXISTS (SELECT 1 FROM notice_recipients r WHERE r.notice_id = n.id AND r.discord_id = ?2)
       )`
  ).bind(ack[1], session.id).first();
  if (!ok) return json({ error: "通告が見つかりません" }, 404);

  await env.DB.prepare(
    "INSERT OR IGNORE INTO notice_acks (notice_id, discord_id, acked_at) VALUES (?, ?, ?)"
  ).bind(ack[1], session.id, new Date().toISOString()).run();
  return json({ ok: true });
}// 通告ごとの確認状況(送信役のみ)
const acks = path.match(/^\/api\/notices\/([\w-]+)\/acks$/);
if (acks && request.method === "GET") {
  if (!canSend(session)) return json({ error: "権限がありません" }, 403);
  const { results } = await env.DB.prepare(
    `SELECT u.discord_id, u.username, a.acked_at
     FROM users u
     LEFT JOIN notice_acks a ON a.notice_id = ?1 AND a.discord_id = u.discord_id
     WHERE (
       EXISTS (SELECT 1 FROM notice_recipients r WHERE r.notice_id = ?1 AND r.discord_id = u.discord_id)
       OR (NOT EXISTS (SELECT 1 FROM notice_recipients r WHERE r.notice_id = ?1) AND u.is_driver = 1)
       OR a.acked_at IS NOT NULL
     )
     ORDER BY a.acked_at IS NULL, a.acked_at, u.username`
  ).bind(acks[1]).all();
  return json(results);
}
      return json({ error: "Not found" }, 404);
    }

    // ログインしていない人には、画面・JS・画像などの静的ファイルを返さない
const isLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
if (!isLocal) {
  const session = await getSession(request, env);
  if (!session) {
    if (request.headers.get("Accept")?.includes("text/html")) {
      return Response.redirect(`${SELF_ORIGIN}/login`, 302);   // 画面の表示はログインへ
    }
    return new Response("ログインが必要です", { status: 401 }); // JSや画像などは401
  }
}
return env.ASSETS.fetch(request);
  },
};