'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface RankRow {
  rank:      number
  nickname:  string
  elo:       number
  wins:      number
  losses:    number
  winRate:   number
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankRow[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/ranking`)
      .then(r => r.json())
      .then(d => setRankings(d.rankings ?? []))
  }, [])

  const medalColor = (rank: number) =>
    rank === 1 ? '#F59E0B' : rank === 2 ? '#9CA3AF' : rank === 3 ? '#B45309' : 'transparent'

  return (
    <main className="min-h-screen bg-hero p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-6 text-white">랭킹</h1>

        <div className="glass-panel overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-widest opacity-40 border-b border-white/10">
                <th className="p-3 text-left">순위</th>
                <th className="p-3 text-left">닉네임</th>
                <th className="p-3 text-right">ELO</th>
                <th className="p-3 text-right">승률</th>
                <th className="p-3 text-right">승/패</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm opacity-30">랭킹 데이터가 없습니다</td></tr>
              ) : rankings.map(row => (
                <tr key={row.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-black" style={{ color: medalColor(row.rank) }}>
                    {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank-1] : row.rank}
                  </td>
                  <td className="p-3 font-bold text-white">{row.nickname}</td>
                  <td className="p-3 text-right font-mono font-black text-brand-gold">{row.elo}</td>
                  <td className="p-3 text-right text-sm">{row.winRate.toFixed(1)}%</td>
                  <td className="p-3 text-right text-xs opacity-50">{row.wins}/{row.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
