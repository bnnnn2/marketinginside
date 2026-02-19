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
  blog_count: number | null;
  visitor_review_count: number | null;
  monthly_review_count: number | null;
  business_count: number | null;
}

// 날짜별 데이터 (대시보드 테이블용)
export interface DayData {
  rank: number | null;
  prevRank: number | null; // 전날 순위 (변동 계산용)
  blog_count: number | null;
  visitor_review_count: number | null;
  monthly_review_count: number | null;
  business_count: number | null;
}

// 키워드별 날짜 테이블 데이터
export interface KeywordTableData {
  keyword: string;
  dates: string[]; // "MM-DD(요일)" 형식, 최신순
  dataByDate: Record<string, DayData>; // key: "YYYY-MM-DD"
}
