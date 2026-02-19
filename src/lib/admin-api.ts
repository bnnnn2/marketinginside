// 관리자 API 클라이언트 (Cloudflare Functions 호출)

import type { Place, Ranking } from "./types";

function getToken(): string {
  return localStorage.getItem("admin_token") ?? "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Admin-Token": getToken(),
  };
}

export async function login(password: string): Promise<string> {
  const resp = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error ?? "로그인 실패");
  }
  const data = await resp.json();
  return data.token as string;
}

export async function fetchPlaces(): Promise<Place[]> {
  const resp = await fetch("/api/places", { headers: authHeaders() });
  if (!resp.ok) throw new Error("매장 목록 조회 실패");
  return resp.json();
}

export async function addPlace(
  name: string,
  naver_place_id: string,
  keywords: string[]
): Promise<Place> {
  const resp = await fetch("/api/places", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, naver_place_id, keywords }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error ?? "매장 추가 실패");
  }
  return resp.json();
}

export async function deletePlace(id: string): Promise<void> {
  const resp = await fetch(`/api/places?id=${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!resp.ok) throw new Error("매장 삭제 실패");
}

export async function fetchRankings(
  place_id: string,
  limit = 100
): Promise<Ranking[]> {
  const resp = await fetch(
    `/api/rankings?place_id=${place_id}&limit=${limit}`,
    { headers: authHeaders() }
  );
  if (!resp.ok) throw new Error("순위 이력 조회 실패");
  return resp.json();
}

export async function checkRank(
  place_id: string,
  naver_place_id: string,
  keywords: string[]
): Promise<{ results: { keyword: string; rank: number | null }[]; checked_at: string }> {
  const resp = await fetch("/api/check-rank", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ place_id, naver_place_id, keywords }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error ?? "순위 조회 실패");
  }
  return resp.json();
}
