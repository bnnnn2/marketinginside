export interface Place {
  id: string;
  name: string;
  naver_place_id: string;
  keywords: string[];
  created_at: string;
}

export interface Ranking {
  id: string;
  place_id: string;
  keyword: string;
  rank: number | null;
  checked_at: string;
}

// 키워드별 최신 순위 (대시보드 표시용)
export interface LatestRanking {
  keyword: string;
  rank: number | null;
  checked_at: string;
  prevRank: number | null; // 직전 순위 (변동 계산용)
}
