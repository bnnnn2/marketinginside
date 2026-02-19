"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Place, Ranking, KeywordTableData, DayData } from "@/lib/types";
import {
  fetchPlaces,
  addPlace,
  updatePlaceKeywords,
  deletePlace,
  fetchRankings,
  checkRank,
} from "@/lib/admin-api";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const day = DAY_KO[d.getDay()];
  return `${mm}-${dd}(${day})`;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function fmt(n: number | null, unit = ""): string {
  if (n == null) return "-";
  return n.toLocaleString() + unit;
}

function fmtCap(n: number | null, unit = ""): string {
  if (n == null) return "-";
  if (n > 9999) return "9,999+" + unit;
  return n.toLocaleString() + unit;
}

// rankings 배열 → 키워드별 날짜 테이블 데이터 변환
function buildKeywordTables(
  rankings: Ranking[],
  keywords: string[]
): KeywordTableData[] {
  return keywords.map((kw) => {
    const kwRows = rankings
      .filter((r) => r.keyword === kw)
      .sort(
        (a, b) =>
          new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
      );

    // 날짜별 최신 1건만 (같은 날 여러 번 체크 시 최신 것 사용)
    const byDate: Record<string, Ranking> = {};
    for (const r of kwRows) {
      const dk = toDateKey(r.checked_at);
      if (!byDate[dk]) byDate[dk] = r;
    }

    // 최신순 날짜 배열 (전체)
    const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    const dataByDate: Record<string, DayData> = {};
    for (let i = 0; i < sortedDates.length; i++) {
      const dk = sortedDates[i];
      const curr = byDate[dk];
      const prevDk = sortedDates[i + 1]; // 하루 전 (배열상 다음)
      const prevRank = prevDk ? (byDate[prevDk]?.rank ?? null) : null;
      dataByDate[dk] = {
        rank: curr.rank,
        prevRank,
        blog_count: curr.blog_count,
        visitor_review_count: curr.visitor_review_count,
        monthly_review_count: curr.monthly_review_count,
        business_count: curr.business_count,
      };
    }

    return { keyword: kw, dates: sortedDates, dataByDate };
  });
}

// 변동폭 표시
function RankChange({ curr, prev }: { curr: number | null; prev: number | null }) {
  if (curr === null) return null;
  if (prev === null) return <span className="text-gray-400 text-xs">-</span>;
  const diff = prev - curr; // 양수 = 순위 상승
  if (diff === 0) return <span className="text-gray-400 text-xs">→</span>;
  if (diff > 0)
    return <span className="text-emerald-600 text-xs font-semibold">▲{diff}</span>;
  return <span className="text-red-500 text-xs font-semibold">▼{Math.abs(diff)}</span>;
}

// 순위 셀 (굵게, 큰 글씨)
function RankDisplay({ rank }: { rank: number | null }) {
  if (rank === null)
    return <span className="text-gray-400 text-sm font-medium">300위 밖</span>;
  if (rank <= 3)
    return <span className="text-amber-600 text-xl font-bold">{rank}위</span>;
  if (rank <= 10)
    return <span className="text-blue-600 text-xl font-bold">{rank}위</span>;
  return <span className="text-gray-800 text-xl font-bold">{rank}위</span>;
}

// 날짜별 카드 셀
function DayCard({ dk, data }: { dk: string; data: DayData }) {
  return (
    <div className="snap-start w-[110px] shrink-0 md:flex-1 md:w-auto md:min-w-[100px] md:max-w-[180px] bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-1 shadow-sm">
      <span className="text-xs text-gray-500 font-medium">{formatDateLabel(dk)}</span>
      <div className="mt-0.5">
        <RankDisplay rank={data.rank} />
      </div>
      <div>
        <RankChange curr={data.rank} prev={data.prevRank} />
      </div>
      <div className="w-full border-t border-gray-100 pt-1.5 mt-0.5 space-y-0.5 text-xs text-gray-600">
        <div className="flex justify-between gap-1">
          <span className="text-blue-600 font-medium">블로그</span>
          <span>{fmtCap(data.blog_count, "개")}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span className="text-emerald-600 font-medium">영수증</span>
          <span>{fmtCap(data.visitor_review_count, "개")}</span>
        </div>
        <div className="flex justify-between gap-1">
          <span className="text-orange-600 font-medium">업체수</span>
          <span>{fmt(data.business_count, "개")}</span>
        </div>
      </div>
    </div>
  );
}

// 전체 기록 모달
function RankHistoryModal({
  table,
  onClose,
}: {
  table: KeywordTableData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl shrink-0">
          <h3 className="text-base font-bold text-gray-900">
            🔍 {table.keyword} — 전체 기록 ({table.dates.length}일)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="flex flex-wrap gap-3">
            {table.dates.map((dk) => (
              <DayCard key={dk} dk={dk} data={table.dataByDate[dk]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 키워드 카드 뷰 1개
function KeywordTable({
  table,
  place,
  onRemoveKeyword,
}: {
  table: KeywordTableData;
  place: Place;
  onRemoveKeyword: (kw: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const naverUrl = `https://m.place.naver.com/restaurant/${place.naver_place_id}`;
  const displayDates = table.dates.slice(0, 7);
  const hasMore = table.dates.length > 7;

  return (
    <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
      {/* 헤더 */}
      <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center justify-between gap-4">
        <span className="font-bold text-sm">🔍 {table.keyword}</span>
        <a
          href={naverUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-200 underline truncate max-w-xs text-xs"
        >
          naver.com ↗ {place.name}
        </a>
      </div>

      {/* 카드 영역 */}
      <div className="p-4 bg-gray-50">
        {table.dates.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">
            순위 체크를 실행하면 데이터가 표시됩니다.
          </p>
        ) : (
          <div className="overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
            <div className="flex items-start gap-3 w-max md:w-auto">
              {displayDates.map((dk) => (
                <DayCard key={dk} dk={dk} data={table.dataByDate[dk]} />
              ))}
              {hasMore && (
                <div className="self-center ml-1 shrink-0">
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-4 rounded-xl border border-blue-200 whitespace-nowrap transition-colors text-center leading-relaxed"
                  >
                    전체 기록<br />보기<br />
                    <span className="font-semibold">({table.dates.length}일)</span>
                    <br />→
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 키워드 삭제 버튼 */}
      <div className="flex justify-end px-4 py-2 bg-white border-t border-gray-200">
        <button
          onClick={() => onRemoveKeyword(table.keyword)}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          ✕ &quot;{table.keyword}&quot; 키워드 삭제
        </button>
      </div>

      {/* 전체 기록 모달 */}
      {showModal && (
        <RankHistoryModal table={table} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// 매장 추가 모달
function AddPlaceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (place: Place) => void;
}) {
  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (!name || !placeId || keywords.length === 0) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const place = await addPlace(name, placeId, keywords);
      onAdd(place);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-4">매장 추가</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              매장 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 함박마을함박스테이크앤파스타"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              네이버 플레이스 ID
            </label>
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 2061557201"
            />
            <p className="text-xs text-gray-500 mt-1">
              네이버 플레이스 URL의 숫자 ID (예: m.place.naver.com/restaurant/<b>2061557201</b>)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색 키워드 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 동래맛집, 동래밥집"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {loading ? "추가 중..." : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 우측 메인 패널
function PlaceMain({
  place,
  onPlaceUpdated,
  onDeleted,
}: {
  place: Place;
  onPlaceUpdated: (updated: Place) => void;
  onDeleted: () => void;
}) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRankings = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await fetchRankings(place.id);
      setRankings(data);
    } catch {
      // 조회 실패 시 빈 배열 유지
    } finally {
      setLoadingData(false);
    }
  }, [place.id]);

  useEffect(() => {
    setRankings([]);
    setCheckMsg("");
    loadRankings();
  }, [place.id, loadRankings]);

  async function handleCheckRank() {
    setChecking(true);
    setCheckMsg("");
    try {
      const result = await checkRank(
        place.id,
        place.naver_place_id,
        place.keywords
      );
      const summary = result.results
        .map((r) => `${r.keyword}: ${r.rank !== null ? r.rank + "위" : "300위 밖"}`)
        .join(", ");
      setCheckMsg(`✓ 완료 — ${summary}`);
      await loadRankings();
    } catch (err) {
      setCheckMsg(`오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    } finally {
      setChecking(false);
    }
  }

  async function handleAddKeyword() {
    const kw = newKeyword.trim();
    if (!kw || place.keywords.includes(kw)) return;
    setKeywordLoading(true);
    try {
      const updated = await updatePlaceKeywords(place.id, [
        ...place.keywords,
        kw,
      ]);
      onPlaceUpdated(updated);
      setNewKeyword("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "키워드 추가 실패");
    } finally {
      setKeywordLoading(false);
    }
  }

  async function handleRemoveKeyword(kw: string) {
    if (!confirm(`"${kw}" 키워드를 삭제하시겠습니까?`)) return;
    setKeywordLoading(true);
    try {
      const updated = await updatePlaceKeywords(
        place.id,
        place.keywords.filter((k) => k !== kw)
      );
      onPlaceUpdated(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "키워드 삭제 실패");
    } finally {
      setKeywordLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `"${place.name}"을 삭제하시겠습니까?\n모든 순위 기록도 삭제됩니다.`
      )
    )
      return;
    setDeleting(true);
    try {
      await deletePlace(place.id);
      onDeleted();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
      setDeleting(false);
    }
  }

  const tables = buildKeywordTables(rankings, place.keywords);
  const naverUrl = `https://m.place.naver.com/restaurant/${place.naver_place_id}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 상단 바 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{place.name}</h2>
            <a
              href={naverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              네이버 플레이스 바로가기 ↗
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckRank}
              disabled={checking}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {checking ? "조회 중..." : "지금 순위 체크"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-500 hover:text-red-700 text-xs px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              {deleting ? "삭제 중..." : "매장 삭제"}
            </button>
          </div>
        </div>

        {checkMsg && (
          <p
            className={`text-xs mt-2 ${checkMsg.startsWith("오류") ? "text-red-600" : "text-emerald-700"}`}
          >
            {checkMsg}
          </p>
        )}
      </div>

      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {loadingData ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            데이터 불러오는 중...
          </div>
        ) : (
          <>
            {/* 키워드 테이블들 */}
            {tables.map((t) => (
              <KeywordTable
                key={t.keyword}
                table={t}
                place={place}
                onRemoveKeyword={handleRemoveKeyword}
              />
            ))}

            {/* 키워드 추가 */}
            <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-white">
              <p className="text-sm font-medium text-gray-700 mb-2">
                + 키워드 추가
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                  placeholder="예: 동래밥집"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={keywordLoading || !newKeyword.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  {keywordLoading ? "..." : "추가"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 메인 대시보드
export default function DashboardPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPlaces() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPlaces();
      setPlaces(data);
      if (data.length > 0 && !selectedPlace) {
        setSelectedPlace(data[0]);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        localStorage.removeItem("admin_token");
        router.replace("/admin");
        return;
      }
      setError(err instanceof Error ? err.message : "매장 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin");
  }

  function handlePlaceAdded(place: Place) {
    setPlaces((prev) => [...prev, place]);
    setSelectedPlace(place);
  }

  function handlePlaceUpdated(updated: Place) {
    setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPlace?.id === updated.id) setSelectedPlace(updated);
  }

  function handlePlaceDeleted() {
    if (!selectedPlace) return;
    const remaining = places.filter((p) => p.id !== selectedPlace.id);
    setPlaces(remaining);
    setSelectedPlace(remaining[0] ?? null);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* 햄버거 버튼 (모바일 전용) */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-blue-600 font-bold">마케팅인사이드</span>
          <span className="text-gray-400 text-sm hidden sm:inline">관리자</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* 모바일 사이드바 백드롭 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 바디 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바: 매장 목록 */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-56 md:shrink-0 md:z-auto
        `}>
          {/* 모바일 닫기 버튼 */}
          <div className="md:hidden flex items-center justify-between px-3 pt-3 pb-1">
            <span className="text-sm font-semibold text-gray-700">매장 목록</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3 space-y-2 border-b border-gray-100">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2 transition-colors"
            >
              + 매장 추가
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="매장 검색..."
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-8">
                불러오는 중...
              </p>
            ) : error ? (
              <p className="text-xs text-red-500 text-center py-8">{error}</p>
            ) : places.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                매장을 추가해주세요
              </p>
            ) : (
              <ul>
                {places
                  .filter((p) =>
                    p.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  return (
                    <li key={place.id}>
                      <button
                        onClick={() => { setSelectedPlace(place); setSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-3 transition-colors border-b border-gray-50 ${
                          isSelected
                            ? "bg-blue-50 border-l-[3px] border-l-blue-500"
                            : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                        }`}
                      >
                        <div
                          className={`text-sm font-medium truncate ${
                            isSelected ? "text-blue-700" : "text-gray-800"
                          }`}
                        >
                          {place.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">
                          {place.keywords.join(", ") || "키워드 없음"}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* 우측 메인 */}
        <main className="flex-1 overflow-hidden bg-gray-50">
          {selectedPlace ? (
            <PlaceMain
              key={selectedPlace.id}
              place={selectedPlace}
              onPlaceUpdated={handlePlaceUpdated}
              onDeleted={handlePlaceDeleted}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              좌측에서 매장을 선택하거나 새 매장을 추가하세요.
            </div>
          )}
        </main>
      </div>

      {/* 매장 추가 모달 */}
      {showAddModal && (
        <AddPlaceModal
          onClose={() => setShowAddModal(false)}
          onAdd={handlePlaceAdded}
        />
      )}
    </div>
  );
}
