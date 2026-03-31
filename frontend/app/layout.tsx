import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FateDice — 운명은 주사위가 결정한다',
  description: '주사위 + 캐릭터 카드 기반 실시간 1v1 대전 보드게임',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  )
}
