/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phaser는 SSR 불가 (window 객체 사용) — 클라이언트 전용 처리는 dynamic import로
  transpilePackages: [],
}

module.exports = nextConfig
