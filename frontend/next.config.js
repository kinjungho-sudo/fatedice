// Cloudflare Pages 로컬 개발 시 바인딩 활성화
const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(() => {/* 선택 사항 — 없어도 무방 */})
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // shared 패키지를 트랜스파일
  transpilePackages: [],
  // Phaser는 SSR 불가 (window 객체 사용) — 클라이언트 전용 처리는 dynamic import로
  // Cloudflare Pages: Next.js 이미지 최적화 비활성화 (edge 환경)
  images: { unoptimized: true },
}

module.exports = nextConfig
