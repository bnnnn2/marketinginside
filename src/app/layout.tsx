import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "마케팅인사이드 | 플레이스 상위노출 · 블로그체험단 전문",
    template: "%s | 마케팅인사이드",
  },
  description:
    "네이버 플레이스 상위노출과 블로그체험단 전문 마케팅 대행사. 실질적인 성과로 내 가게 매출을 높여드립니다. 지금 무료 상담 받으세요.",
  keywords: [
    "플레이스 상위노출",
    "블로그체험단",
    "네이버 플레이스 상위노출",
    "블로그 체험단",
    "마케팅 대행사",
    "바이럴 마케팅",
    "마케팅인사이드",
    "Marketing Inside",
    "소상공인 마케팅",
    "플레이스 마케팅",
    "네이버 플레이스",
    "맛집 마케팅",
    "카페 마케팅",
    "지역 마케팅",
  ],
  authors: [{ name: "마케팅인사이드" }],
  creator: "마케팅인사이드",
  publisher: "마케팅인사이드",
  openGraph: {
    title: "마케팅인사이드 | 플레이스 상위노출 · 블로그체험단 전문",
    description:
      "네이버 플레이스 상위노출과 블로그체험단 전문 마케팅 대행사. 실질적인 성과로 내 가게 매출을 높여드립니다.",
    url: "https://marketinginside.co.kr",
    siteName: "마케팅인사이드",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "마케팅인사이드 | 플레이스 상위노출 · 블로그체험단 전문",
    description:
      "네이버 플레이스 상위노출과 블로그체험단 전문 마케팅 대행사.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // 나중에 서치콘솔 연동 시 주석 해제
  // verification: {
  //   google: "구글서치콘솔_인증코드",
  //   other: { "naver-site-verification": "네이버서치어드바이저_인증코드" },
  // },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "마케팅인사이드",
  alternateName: "Marketing Inside",
  description: "네이버 플레이스 상위노출과 블로그체험단 전문 마케팅 대행사",
  url: "https://marketinginside.co.kr",
  // 나중에 실제 정보로 교체
  // telephone: "+82-10-XXXX-XXXX",
  // address: {
  //   "@type": "PostalAddress",
  //   addressLocality: "서울",
  //   addressCountry: "KR",
  // },
  serviceType: ["플레이스 상위노출", "블로그체험단", "마케팅 대행"],
  areaServed: "KR",
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${notoSansKR.className} antialiased`}>{children}</body>
    </html>
  );
}
