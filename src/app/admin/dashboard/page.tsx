"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Place, Ranking, LatestRanking } from "@/lib/types";
import {
  fetchPlaces,
  addPlace,
  deletePlace,
  fetchRankings,
  checkRank,
} from "@/lib/admin-api";

// 키워드별 최신 2개 순위 추출 → 변동 계산
function computeLatestRankings(rankings: Ranking[]): LatestRanking[] {
  const byKeyword: Record<string, Ranking[]> = {};
  for (const r of rankings) {
    if (!byKeyword[r.keyword]) byKeyword[r.keyword] = [];
    byKeyword[r.keyword].push(r);
  }

  return Object.entries(byKeyword).map(([keyword, rows]) => {
    const sorted = rows.sort(
      (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
    );
    return {
      keyword,
      rank: sorted[0]?.rank ?? null,
      checked_at: sorted[0]?.checked_at ?? "",
      prevRank: sorted[1]?.rank ?? null,
    };
  });
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === null)
    return <span className="text-gray-400 text-xs">300위 밖</span>;
  if (rank <= 3) return <span className="font-bold text-amber-600">{rank}위</span>;
  if (rank <= 10) return <span className="font-semibold text-blue-600">{rank}위</span>;
  return <span className="text-gray-700">{rank}위</span>;
}

function RankChange({ curr, prev }: { curr: number | null; prev: number | null }) {
  if (curr === null || prev === null) return null;
  const diff = prev - curr; // 양수 = 상승
  if (diff === 0) return <span className="text-gray-400 text-xs">→</span>;
  if (diff > 0)
    return (
      <span className="text-emerald-600 text-xs font-medium">↑{diff}</span>
    );
  return (
    <span className="text-red-500 text-xs font-medium">↓{Math.abs(diff)}</span>
  );
}

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
              placeholder="예: 카페 강남점"
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
              placeholder="예: 1234567890"
            />
            <p className="text-xs text-gray-500 mt-1">
              네이버 지도에서 매장 클릭 → URL의 숫자 ID
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
              placeholder="예: 강남카페, 신논현역카페"
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

// 우측 상세 패널
function PlaceDetail({
  place,
  onDeleted,
}: {
  place: Place;
  onDeleted: () => void;
}) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadRankings = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchRankings(place.id);
      setRankings(data);
    } catch {
      // 조회 실패 시 빈 배열 유지
    } finally {
      setLoadingHistory(false);
    }
  }, [place.id]);

  useEffect(() => {
    setRankings([]);
    setCheckResult("");
    loadRankings();
  }, [place.id, loadRankings]);

  async function handleCheckRank() {
    setChecking(true);
    setCheckResult("");
    try {
      const result = await checkRank(
        place.id,
        place.naver_place_id,
        place.keywords
      );
      const summary = result.results
        .map(
          (r) =>
            `${r.keyword}: ${r.rank !== null ? r.rank + "위" : "300위 밖"}`
        )
        .join(", ");
      setCheckResult(`완료 (${summary})`);
      await loadRankings();
    } catch (err) {
      setCheckResult(
        `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
    } finally {
      setChecking(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`"${place.name}"을 삭제하시겠습니까? 모든 순위 기록도 삭제됩니다.`))
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

  const latestRankings = computeLatestRankings(rankings);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{place.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              플레이스 ID: {place.naver_place_id}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {place.keywords.map((kw) => (
            <span
              key={kw}
              className="bg-blue-50 text-blue-700 text-xs rounded-full px-2.5 py-0.5"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 순위 체크 버튼 */}
      <div className="p-5 border-b border-gray-100">
        <button
          onClick={handleCheckRank}
          disabled={checking}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          {checking ? "순위 조회 중... (최대 수분 소요)" : "지금 순위 체크"}
        </button>
        {checkResult && (
          <p
            className={`text-xs mt-2 ${checkResult.startsWith("오류") ? "text-red-600" : "text-emerald-700"}`}
          >
            {checkResult}
          </p>
        )}
      </div>

      {/* 키워드별 최신 순위 */}
      {latestRankings.length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            키워드별 최신 순위
          </h3>
          <div className="space-y-2">
            {latestRankings.map((lr) => (
              <div
                key={lr.keyword}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-gray-800">{lr.keyword}</span>
                <div className="flex items-center gap-2">
                  <RankBadge rank={lr.rank} />
                  <RankChange curr={lr.rank} prev={lr.prevRank} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 순위 히스토리 */}
      <div className="flex-1 overflow-auto p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          순위 히스토리
        </h3>
        {loadingHistory ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : rankings.length === 0 ? (
          <p className="text-sm text-gray-400">
            아직 순위 기록이 없습니다. 순위 체크를 실행해주세요.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">날짜</th>
                  <th className="text-left pb-2 font-medium">키워드</th>
                  <th className="text-right pb-2 font-medium">순위</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 text-gray-500">{formatDate(r.checked_at)}</td>
                    <td className="py-1.5 text-gray-700">{r.keyword}</td>
                    <td className="py-1.5 text-right">
                      <RankBadge rank={r.rank} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

  function handlePlaceDeleted() {
    if (!selectedPlace) return;
    const remaining = places.filter((p) => p.id !== selectedPlace.id);
    setPlaces(remaining);
    setSelectedPlace(remaining[0] ?? null);
  }

  // 좌측 매장 목록에서 각 매장의 최신 순위 표시는 별도 API 없이 단순화
  // (대시보드 로딩 시마다 rankings를 전부 불러오면 과도한 요청)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-blue-600 font-bold">마케팅인사이드</span>
          <span className="text-gray-400 text-sm">관리자</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* 바디 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 매장 목록 */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2 transition-colors"
            >
              + 매장 추가
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
            ) : error ? (
              <p className="text-sm text-red-500 text-center py-8">{error}</p>
            ) : places.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                등록된 매장이 없습니다
              </p>
            ) : (
              <ul>
                {places.map((place) => (
                  <li key={place.id}>
                    <button
                      onClick={() => setSelectedPlace(place)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                        selectedPlace?.id === place.id
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div
                        className={`text-sm font-medium ${
                          selectedPlace?.id === place.id
                            ? "text-blue-700"
                            : "text-gray-800"
                        }`}
                      >
                        {place.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {place.keywords.join(", ")}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* 우측: 상세 */}
        <main className="flex-1 overflow-hidden bg-white">
          {selectedPlace ? (
            <PlaceDetail
              key={selectedPlace.id}
              place={selectedPlace}
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
