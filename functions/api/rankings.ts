// Cloudflare Pages Function: GET /api/rankings?place_id=UUID&limit=100
// 특정 매장의 순위 히스토리 조회

import { verifyToken } from "../_shared/verify-token";

interface Env {
  ADMIN_TOKEN_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestGet(context: any): Promise<Response> {
  const env = context.env as Env;

  const token = context.request.headers.get("X-Admin-Token") ?? "";
  if (!(await verifyToken(token, env.ADMIN_TOKEN_SECRET))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const url = new URL(context.request.url);
  const placeId = url.searchParams.get("place_id");
  const limit = url.searchParams.get("limit") ?? "100";

  if (!placeId) {
    return json({ error: "place_id 파라미터가 필요합니다." }, 400);
  }

  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/rankings?place_id=eq.${placeId}&order=checked_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    return json({ error: "순위 이력 조회 실패", detail: err }, 500);
  }

  const rankings = await resp.json();
  return json(rankings);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestOptions(_context: any): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    },
  });
}
