// src/index.ts

interface Env {
  DISCORD_CLIENT_SECRET: string;
  SESSIONS: KVNamespace;
}

const DISCORD_API = "https://discord.com/api";
const ALLOWED_ORIGIN = "https://aethel-kodama.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/login") {
      const params = new URLSearchParams({
        client_id: "1552100573283876935",
        redirect_uri: "https://cassrworker.aethel-bassist.workers.dev/callback",
        response_type: "code",
        scope: "identify guilds.members.read",
      });
      return Response.redirect(`${DISCORD_API}/oauth2/authorize?${params}`, 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("code がありません", { status: 400 });

      const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: "1552100573283876935",
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: "https://cassrworker.aethel-bassist.workers.dev/callback",
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token) {
        return new Response("トークン取得失敗", { status: 400 });
      }

      const memberRes = await fetch(
        `${DISCORD_API}/users/@me/guilds/1137932995525877841/member`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      if (!memberRes.ok) {
        return new Response("サーバーに参加していません", { status: 403 });
      }
      const member = (await memberRes.json()) as {
        roles?: string[];
        user: { id: string; username: string };
      };

      const authorized = member.roles?.includes("1170176484917379143");
      if (!authorized) {
        return new Response("権限がありません", { status: 403 });
      }

      const sessionId = crypto.randomUUID();
      await env.SESSIONS.put(
        sessionId,
        JSON.stringify({ id: member.user.id, username: member.user.username, roles: member.roles }),
        { expirationTtl: 60 * 60 * 24 * 7 }
      );

      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );
      headers.set("Location", "https://aethel-kodama.github.io/CAS-SR/");

      return new Response(null, { status: 302, headers });
    }

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