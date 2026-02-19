export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===================== 네비게이션 ===================== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-700">마케팅인사이드</span>
            </a>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-600 hover:text-blue-700 font-medium text-sm transition-colors">서비스</a>
              <a href="#why" className="text-gray-600 hover:text-blue-700 font-medium text-sm transition-colors">왜 우리인가</a>
              <a href="#process" className="text-gray-600 hover:text-blue-700 font-medium text-sm transition-colors">진행 과정</a>
              <a
                href="#contact"
                className="bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-blue-800 transition-colors"
              >
                무료 상담
              </a>
            </div>
            {/* 모바일 상담 버튼 */}
            <a
              href="#contact"
              className="md:hidden bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-800 transition-colors"
            >
              무료 상담
            </a>
          </div>
        </div>
      </nav>

      {/* ===================== 히어로 ===================== */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block bg-blue-600/40 text-blue-200 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-blue-400/30">
              플레이스 상위노출 · 블로그체험단 전문
            </span>
            <h1 className="text-4xl lg:text-6xl font-black leading-tight mb-6 tracking-tight">
              내 가게,<br />
              검색하면 나와야 합니다
            </h1>
            <p className="text-blue-100 text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl">
              네이버 플레이스에서 경쟁자보다 먼저 노출되고,<br />
              블로그 리뷰로 신뢰도까지 높이세요.<br />
              마케팅인사이드가 매출로 연결해 드립니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contact"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center shadow-lg shadow-orange-500/30"
              >
                무료 상담 신청하기 →
              </a>
              <a
                href="#services"
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl text-lg transition-colors text-center border border-white/20"
              >
                서비스 보기
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 통계 바 ===================== */}
      <section className="bg-gray-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "누적 성공 사례" },
              { value: "98%", label: "고객 만족도" },
              { value: "3일", label: "평균 노출 시작" },
              { value: "24/7", label: "전담 매니저 지원" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black text-blue-400">{stat.value}</div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 서비스 ===================== */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">핵심 서비스</h2>
            <p className="text-gray-500 text-lg">내 가게에 꼭 필요한 마케팅, 딱 두 가지로 시작합니다</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 플레이스 상위노출 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-3xl">
                📍
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">플레이스 상위노출</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                네이버 지도·플레이스에서 고객이 검색하면 내 가게가 먼저 보입니다.
                경쟁자를 밀어내고 상단에 안착시켜 드립니다.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "네이버 플레이스 상위 3 진입 목표",
                  "지역 + 업종 키워드 정밀 최적화",
                  "리뷰 관리 전략 포함",
                  "실시간 순위 모니터링",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="block text-center bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                상담 신청하기
              </a>
            </div>

            {/* 블로그체험단 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-6 text-3xl">
                ✍️
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">블로그 체험단</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                실제 방문한 블로거의 진정성 있는 리뷰로 잠재 고객의 신뢰를 얻습니다.
                자연스러운 입소문으로 방문율을 높여드립니다.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "검증된 파워블로거 매칭",
                  "네이버 블로그 상위 노출 최적화",
                  "리뷰 품질 및 키워드 관리",
                  "월 단위 리뷰 현황 리포트",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                상담 신청하기
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 왜 마케팅인사이드인가 ===================== */}
      <section id="why" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              왜 마케팅인사이드인가
            </h2>
            <p className="text-gray-500 text-lg">수백 개의 업체를 성공시킨 노하우가 있습니다</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🎯",
                title: "데이터 기반 전략",
                desc: "감이 아닌 데이터로 분석하고 실행합니다. 매 단계 수치로 검증합니다.",
              },
              {
                icon: "👤",
                title: "전담 매니저 배정",
                desc: "담당 매니저 한 명이 처음부터 끝까지 책임지고 관리합니다.",
              },
              {
                icon: "📊",
                title: "투명한 성과 보고",
                desc: "진행 현황과 성과를 정기 리포트로 보고드려 불안함이 없습니다.",
              },
              {
                icon: "⚡",
                title: "빠른 노출 시작",
                desc: "계약 후 3일 이내 캠페인이 시작되어 빠른 효과를 체감합니다.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 진행 과정 ===================== */}
      <section id="process" className="py-20 bg-blue-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-black mb-4">진행 과정</h2>
            <p className="text-blue-200 text-lg">복잡하지 않습니다. 4단계로 간단하게</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              {
                step: "01",
                title: "무료 상담",
                desc: "업종, 지역, 현황을 파악하고 맞춤 솔루션을 제안합니다",
              },
              {
                step: "02",
                title: "전략 수립",
                desc: "목표 키워드와 캠페인 플랜을 함께 확정합니다",
              },
              {
                step: "03",
                title: "캠페인 실행",
                desc: "전담 매니저가 실행하고 매일 모니터링합니다",
              },
              {
                step: "04",
                title: "성과 리포트",
                desc: "노출 순위, 방문자 변화 등 성과를 투명하게 공유합니다",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-black text-blue-800 mb-3 leading-none">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-blue-300 text-sm leading-relaxed">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-6 -right-5 text-blue-700 text-xl font-bold">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 상담 CTA ===================== */}
      <section id="contact" className="py-20 bg-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-black mb-4">
            지금 무료 상담받고<br />
            빠르게 시작하세요
          </h2>
          <p className="text-orange-100 text-lg mb-10 leading-relaxed">
            상담은 무료이며 부담 없이 문의하실 수 있습니다.<br />
            카카오톡 또는 전화로 편하게 연락주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* TODO: 카카오 채널 개설 후 href를 실제 URL로 교체 */}
            <a
              href="#contact"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
              💬 카카오톡 상담
            </a>
            {/* TODO: 실제 전화번호로 교체 */}
            <a
              href="#contact"
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors border border-white/30 flex items-center justify-center gap-2"
            >
              📞 전화 상담
            </a>
          </div>
          <p className="text-orange-200 text-sm mt-8">
            ⏰ 평일 09:00 – 18:00 운영 / 주말·공휴일은 카카오톡으로 문의
          </p>
        </div>
      </section>

      {/* ===================== 푸터 ===================== */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div>
              <div className="text-white font-black text-lg mb-1">마케팅인사이드</div>
              <div className="text-sm text-gray-500 mb-5">Marketing Inside</div>
              {/* 나중에 실제 사업자 정보로 교체 */}
              <div className="text-sm space-y-1">
                <p>사업자등록번호: 000-00-00000</p>
                <p>대표: 홍길동</p>
                <p>이메일: contact@marketinginside.co.kr</p>
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">서비스</div>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="#services" className="hover:text-white transition-colors">플레이스 상위노출</a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white transition-colors">블로그 체험단</a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold mb-3">바로가기</div>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="#why" className="hover:text-white transition-colors">왜 마케팅인사이드</a>
                </li>
                <li>
                  <a href="#process" className="hover:text-white transition-colors">진행 과정</a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">무료 상담</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} 마케팅인사이드. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
