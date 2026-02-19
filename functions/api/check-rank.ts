// Cloudflare Pages Function: POST /api/check-rank
// 네이버 플레이스 순위 + 부가 데이터 조회 후 Supabase에 저장
// 모바일 기준, 광고 제외

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

function parseNum(val: unknown): number | null {
  if (val == null) return null;
  const n =
    typeof val === "number"
      ? val
      : parseInt(String(val).replace(/,/g, ""), 10);
  return isNaN(n) ? null : n;
}

const GRAPHQL_ENDPOINT = "https://pcmap-api.place.naver.com/place/graphql";
const DISPLAY = 15;

const GQL_QUERY = `
query getRestaurants($restaurantListInput: RestaurantListInput) {
  restaurantList(input: $restaurantListInput) {
    items {
      id
      name
      dbType
      visitorReviewCount
      blogCafeReviewCount
    }
    total
  }
}`;

interface NaverItem {
  id: string;
  name: string;
  dbType: string;
  visitorReviewCount?: unknown;
  blogCafeReviewCount?: unknown;
}

interface NaverGQLResponse {
  data?: {
    restaurantList?: {
      items: NaverItem[];
      total: number;
    };
  };
  errors?: Array<{ message: string }>;
}

async function searchNaverPage(
  keyword: string,
  start: number
): Promise<{ items: NaverItem[]; total: number }> {
  const payload = {
    operationName: "getRestaurants",
    variables: {
      restaurantListInput: { query: keyword, start, display: DISPLAY },
    },
    query: GQL_QUERY,
  };

  const resp = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-apollo-operation-name": "getRestaurants",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Referer: "https://m.place.naver.com/",
      Accept: "application/json",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) return { items: [], total: 0 };

  const data = (await resp.json()) as NaverGQLResponse;
  if (data.errors?.length) return { items: [], total: 0 };

  // 광고(dbType !== 'drt') 제외
  const items = (data.data?.restaurantList?.items ?? []).filter(
    (item) => item.dbType === "drt"
  );
  const total = data.data?.restaurantList?.total ?? 0;
  return { items, total };
}

interface CheckResult {
  keyword: string;
  rank: number | null;
  blog_count: number | null;
  visitor_review_count: number | null;
  monthly_review_count: number | null;
  business_count: number | null;
}

async function findRankAndData(
  keyword: string,
  placeId: string,
  maxPages = 20
): Promise<CheckResult> {
  let rank: number | null = null;
  let visitorReviewCount: number | null = null;
  let blogCount: number | null = null;
  let businessCount: number | null = null;
  let position = 0;

  for (let page = 1; page <= maxPages; page++) {
    const start = (page - 1) * DISPLAY + 1;
    const { items, total } = await searchNaverPage(keyword, start);

    if (page === 1) {
      businessCount = total;
    }

    if (items.length === 0) break;

    for (const item of items) {
      position++;
      if (item.id === placeId) {
        rank = position;
        visitorReviewCount = parseNum(item.visitorReviewCount);
        blogCount = parseNum(item.blogCafeReviewCount);
        break;
      }
    }

    if (rank !== null) break;
    if (items.length < DISPLAY) break;
  }

  return {
    keyword,
    rank,
    blog_count: blogCount,
    visitor_review_count: visitorReviewCount,
    monthly_review_count: null, // TODO: 네이버 플레이스 상세 API 조사 후 구현
    business_count: businessCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(context: any): Promise<Response> {
  const env = context.env as Env;

  const token = context.request.headers.get("X-Admin-Token") ?? "";
  if (!(await verifyToken(token, env.ADMIN_TOKEN_SECRET))) {
    return json({ error: "인증이 필요합니다." }, 401);
  }

  const body = (await context.request.json()) as {
    place_id: string;
    naver_place_id: string;
    keywords: string[];
  };

  if (!body.place_id || !body.naver_place_id || !body.keywords?.length) {
    return json(
      { error: "place_id, naver_place_id, keywords 필드가 필요합니다." },
      400
    );
  }

  const results: CheckResult[] = [];
  const checkedAt = new Date().toISOString();

  for (const keyword of body.keywords) {
    const result = await findRankAndData(keyword, body.naver_place_id);
    results.push(result);
  }

  const rows = results.map((r) => ({
    place_id: body.place_id,
    keyword: r.keyword,
    rank: r.rank,
    checked_at: checkedAt,
    blog_count: r.blog_count,
    visitor_review_count: r.visitor_review_count,
    monthly_review_count: r.monthly_review_count,
    business_count: r.business_count,
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
