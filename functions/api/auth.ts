// Cloudflare Pages Function: POST /api/auth
// 비밀번호 검증 후 HMAC 서명된 세션 토큰 반환

interface Env {
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN_SECRET: string;
}

async function generateToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp)
  );
  const hexSig = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${timestamp}.${hexSig}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any): Promise<Response> {
  const env = context.env as Env;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = await context.request.json();
    const { password } = body as { password: string };

    if (!password || password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "비밀번호가 틀렸습니다." }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = await generateToken(env.ADMIN_TOKEN_SECRET);
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: "요청 처리 중 오류가 발생했습니다.", debug: msg }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestOptions(_context: any): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    },
  });
}
