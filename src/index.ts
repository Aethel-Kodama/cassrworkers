// src/index.ts

const DISCORD_API = "https://discord.com/api";
const ALLOWED_ORIGIN = "https://aethel-kodama.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // preflight対応
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // 1. ログイン開始
    if (url.pathname === "/login") {
      const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        redirect_uri: env.DISCORD_REDIRECT_URI, // cassrworkers側の/callback
        response_type: "code",
        scope: "identify guilds.members.read",
      });
      return Response.redirect(`${DISCORD_API}/oauth2/authorize?${params}`, 302);
    }

    // 2. Discordからのコールバック
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("code がありません", { status: 400 });

      // コードをアクセストークンに交換
      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: env.DISCORD_REDIRECT_URI,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return new Response("トークン取得失敗", { status: 400 });
      }

      // ギルドメンバー情報(ロール含む)を取得
      const memberRes = await fetch(
        `${DISCORD_API}/users/@me/guilds/${env.GUILD_ID}/member`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      if (!memberRes.ok) {
        return new Response("サーバーに参加していません", { status: 403 });
      }
      const member = await memberRes.json();

      // 指定ロールを持っているかチェック
      const authorized = member.roles?.includes(env.REQUIRED_ROLE_ID);
      if (!authorized) {
        return new Response("権限がありません", { status: 403 });
      }

      // セッション発行してKVに保存
      const sessionId = crypto.randomUUID();
      await env.SESSIONS.put(
        sessionId,
        JSON.stringify({ id: member.user.id, username: member.user.username, roles: member.roles }),
        { expirationTtl: 60 * 60 * 24 * 7 }
      );

      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 7}`
      );
      headers.set("Location", env.PAGES_URL);

      return new Response(null, { status: 302, headers });
    }

    // 3. ログイン状態確認(CAS-SR側から呼ぶ)
    if (url.pathname === "/me") {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/session=([^;]+)/);
      if (!match) {
        return Response.json({ loggedIn: false }, { status: 401, headers: corsHeaders() });
      }
      const data = await env.SESSIONS.get(match[1]);
      if (!data) {
        return Response.json({ loggedIn: false }, { status: 401, headers: corsHeaders() });
      }
      return Response.json({ loggedIn: true, user: JSON.parse(data) }, { headers: corsHeaders() });
    }

    return new Response("Not Found", { status: 404 });
  },
};
