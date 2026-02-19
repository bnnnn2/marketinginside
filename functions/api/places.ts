// Cloudflare Pages Function: /api/places
// GET: 매장 목록 조회
// POST: 매장 추가
// DELETE: 매장 삭제

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
async function authenticate(context: any): Promise<boolean> {
  const env = context.env as Env;
  const token = context.request.headers.get("X-Admin-Token") ?? "";
  return verifyToken(token, env.ADMIN_TOKEN_SECRET);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestGet(context: any): Promise<Response> {
  if (!(await authenticate(context))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const env = context.env as Env;
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/places?select=*&order=created_at.asc`,
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
    return json({ error: "매장 목록 조회 실패", detail: err }, 500);
  }

  const places = await resp.json();
  return json(places);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any): Promise<Response> {
  if (!(await authenticate(context))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const env = context.env as Env;
  const body = await context.request.json() as {
    name: string;
    naver_place_id: string;
    keywords: string[];
  };

  if (!body.name || !body.naver_place_id || !body.keywords?.length) {
    return json({ error: "name, naver_place_id, keywords 필드가 필요합니다." }, 400);
  }

  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/places`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: body.name,
      naver_place_id: body.naver_place_id,
      keywords: body.keywords,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return json({ error: "매장 추가 실패", detail: err }, 500);
  }

  const created = await resp.json();
  return json(Array.isArray(created) ? created[0] : created, 201);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestDelete(context: any): Promise<Response> {
  if (!(await authenticate(context))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const env = context.env as Env;
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return json({ error: "id 파라미터가 필요합니다." }, 400);
  }

  // 관련 rankings 먼저 삭제 (CASCADE가 없을 경우 대비)
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/places?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    return json({ error: "매장 삭제 실패", detail: err }, 500);
  }

  return json({ success: true });
}

// PATCH /api/places?id=UUID — 키워드 배열 업데이트
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPatch(context: any): Promise<Response> {
  if (!(await authenticate(context))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const env = context.env as Env;
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return json({ error: "id 파라미터가 필요합니다." }, 400);
  }

  const body = (await context.request.json()) as { keywords: string[] };

  if (!Array.isArray(body.keywords)) {
    return json({ error: "keywords 배열이 필요합니다." }, 400);
  }

  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/places?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ keywords: body.keywords }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return json({ error: "키워드 업데이트 실패", detail: err }, 500);
  }

  const updated = await resp.json();
  return json(Array.isArray(updated) ? updated[0] : updated);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestOptions(_context: any): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    },
  });
}
