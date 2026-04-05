'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Icon from '@/components/Icon'

interface Stats {
  totalBookings: number
  pendingBookings: number
  conflictBookings: number
  availableDays: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats]   = useState<Stats | null>(null)
  const [copied, setCopied] = useState(false)

  const origin   = typeof window !== 'undefined' ? window.location.origin : 'https://iyueding.app'
  const shareUrl = `${origin}/${session?.user.slug}`

  useEffect(() => {
    fetch('/api/dashboard/stats', { cache: 'no-store' }).then((r) => r.json()).then(setStats).catch(() => {})
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="p-6 sm:p-8 w-full">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink">嗨，{session?.user.name} 👋</h1>
        <p className="text-ink-muted mt-1">這是你的預約控制台</p>
      </div>

      {/* Conflict alert */}
      {stats && stats.conflictBookings > 0 && (
        <Link href="/dashboard/bookings?filter=conflict_pending"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200
                     rounded-2xl px-5 py-4 mb-6 hover:bg-amber-100 transition w-full">
          <Icon name="warning" size={22} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              有 {stats.conflictBookings} 筆新娘預約與學員課程衝突
            </p>
            <p className="text-amber-600 text-sm mt-0.5">點此查看，請儘快與學員協調換日</p>
          </div>
          <Icon name="chevron-right" size={18} className="text-amber-400 shrink-0" />
        </Link>
      )}

      {/* Share link card — full width */}
      <div className="bg-primary rounded-2xl p-6 text-white mb-7 w-full">
        <p className="text-sm font-medium opacity-80 mb-1 uppercase tracking-wide">你的預約連結</p>
        <p className="font-bold text-base sm:text-lg break-all mb-4 opacity-90">{shareUrl}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyLink}
            className="flex items-center gap-2 bg-white text-accent px-4 py-2
                       rounded-full text-sm font-bold hover:bg-bg transition">
            <Icon name="copy" size={15} />
            {copied ? '✓ 已複製！' : '複製連結'}
          </button>
          <Link href={`/${session?.user.slug}`} target="_blank"
            className="flex items-center gap-2 border border-white/60 text-white
                       px-4 py-2 rounded-full text-sm font-bold hover:bg-white/10 transition">
            <Icon name="link-ext" size={15} />
            預覽頁面
          </Link>
        </div>
      </div>

      {/* Stats — 4 cols full width */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7 w-full">
        {[
          { label: '待確認',    value: stats?.pendingBookings  ?? '—', color: 'text-amber-600' },
          { label: '衝突',      value: stats?.conflictBookings ?? '—', color: 'text-red-500'   },
          { label: '總預約數',  value: stats?.totalBookings    ?? '—', color: 'text-primary'   },
          { label: '可預約天數', value: stats?.availableDays   ?? '—', color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-tag p-5 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-ink-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions — full width 2-col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <Link href="/dashboard/availability"
          className="bg-white border border-tag rounded-2xl p-6
                     hover:border-primary/40 hover:shadow-sm transition flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-tag flex items-center justify-center shrink-0">
            <Icon name="time" size={24} className="text-primary" />
          </span>
          <div>
            <div className="font-semibold text-ink text-base">檔期管理</div>
            <div className="text-sm text-ink-muted mt-0.5">分別設定學員與新娘可預約日期</div>
          </div>
        </Link>
        <Link href="/dashboard/bookings"
          className="bg-white border border-tag rounded-2xl p-6
                     hover:border-primary/40 hover:shadow-sm transition flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-tag flex items-center justify-center shrink-0">
            <Icon name="users" size={24} className="text-primary" />
          </span>
          <div>
            <div className="font-semibold text-ink text-base">預約名單</div>
            <div className="text-sm text-ink-muted mt-0.5">管理學員課程與新娘預約詳情</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
