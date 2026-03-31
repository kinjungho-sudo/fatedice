import { redirect } from 'next/navigation'

// Cloudflare Pages: 서버 컴포넌트는 edge runtime 필수
export const runtime = 'edge'

// 루트 접속 시 로비로 리다이렉트
// 실제 인증 체크는 각 페이지에서 수행
export default function RootPage() {
  redirect('/lobby')
}
