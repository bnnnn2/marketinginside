// Cloudflare Pages Function: POST /api/check-rank
// 네이버 플레이스 순위 조회 후 Supabase에 저장

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

interface NaverPlace {
  id: string;
  name: string;
}

interface NaverSearchResponse {
  result?: {
    place?: {
      list?: NaverPlace[];
      totalCount?: number;
    };
  };
}

// 네이버 플레이스 검색 API 호출 (1-indexed page)
async function searchNaver(
  keyword: string,
  page: number
): Promise<NaverPlace[]> {
  const url = `https://map.naver.com/p/api/search/allSearch?query=${encodeURIComponent(keyword)}&type=place&page=${page}`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://map.naver.com/",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });

  if (!resp.ok) return [];

  const data = (await resp.json()) as NaverSearchResponse;
  return data?.result?.place?.list ?? [];
}

// 특정 placeId의 순위 탐색 (최대 maxPages 페이지)
async function findRank(
  keyword: string,
  placeId: string,
  maxPages = 20
): Promise<number | null> {
  let rank = 0;

  for (let page = 1; page <= maxPages; page++) {
    const results = await searchNaver(keyword, page);

    if (results.length === 0) break; // 더 이상 결과 없음

    for (const item of results) {
      rank++;
      if (item.id === placeId) {
        return rank;
      }
    }

    // 결과가 15개 미만이면 마지막 페이지
    if (results.length < 15) break;
  }

  return null; // 300위 밖
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any): Promise<Response> {
  const env = context.env as Env;

  const token = context.request.headers.get("X-Admin-Token") ?? "";
  if (!(await verifyToken(token, env.ADMIN_TOKEN_SECRET))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const body = await context.request.json() as {
    place_id: string;        // Supabase places.id (UUID)
    naver_place_id: string;  // 네이버 플레이스 ID
    keywords: string[];
  };

  if (!body.place_id || !body.naver_place_id || !body.keywords?.length) {
    return json({ error: "place_id, naver_place_id, keywords 필드가 필요합니다." }, 400);
  }

  const results: { keyword: string; rank: number | null }[] = [];
  const checkedAt = new Date().toISOString();

  // 키워드별 순위 조회 (순차 실행으로 과도한 요청 방지)
  for (const keyword of body.keywords) {
    const rank = await findRank(keyword, body.naver_place_id);
    results.push({ keyword, rank });
  }

  // Supabase에 rankings 저장
  const rows = results.map((r) => ({
    place_id: body.place_id,
    keyword: r.keyword,
    rank: r.rank,
    checked_at: checkedAt,
  }));

  const insertResp = await fetch(`${env.SUPABASE_URL}/rest/v1/rankings`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!insertResp.ok) {
    const err = await insertResp.text();
    return json({ error: "순위 저장 실패", detail: err }, 500);
  }

  return json({ success: true, results, checked_at: checkedAt });
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
