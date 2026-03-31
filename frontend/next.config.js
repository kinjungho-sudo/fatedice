/** @type {import('next').NextConfig} */
const nextConfig = {
  // shared 패키지를 트랜스파일
  transpilePackages: [],
  // Phaser는 SSR 불가 (window 객체 사용) — 클라이언트 전용 처리는 dynamic import로
}

module.exports = nextConfig
