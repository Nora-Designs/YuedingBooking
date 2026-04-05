'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogoText } from '@/components/Logo'
import Icon from '@/components/Icon'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router   = useRouter()
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  // Poll for new pending bookings every 30s
  useEffect(() => {
    if (status !== 'authenticated') return
    async function fetchPending() {
      try {
        const res = await fetch('/api/bookings?pending=1', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setPendingCount(Array.isArray(data) ? data.filter((b: { status: string }) =>
            ['pending', 'conflict_pending'].includes(b.status)).length : 0)
        }
      } catch {}
    }
    fetchPending()
    const t = setInterval(fetchPending, 30_000)
    return () => clearInterval(t)
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-primary animate-pulse">載入中...</span>
      </div>
    )
  }
  if (!session) return null

  const navItems = [
    { href: '/dashboard',              label: '總覽',    icon: 'home'     as const, badge: 0 },
    { href: '/dashboard/availability', label: '檔期管理', icon: 'time'     as const, badge: 0 },
    { href: '/dashboard/bookings',     label: '預約名單', icon: 'users'    as const, badge: pendingCount },
    { href: '/dashboard/profile',      label: '個人設定', icon: 'settings' as const, badge: 0 },
  ]

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-tag flex-col shrink-0">

        {/* Logo */}
        <div className="py-4 border-b border-tag flex items-center justify-center">
          <LogoText size="sm" href="/dashboard" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition ${
                  active ? 'bg-tag text-accent' : 'text-ink-light hover:bg-bg'
                }`}>
                <Icon name={item.icon} size={20}
                  className={active ? 'text-primary' : 'text-ink-muted'} />
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs
                                   font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-tag space-y-0.5">
          <Link href={`/${session.user.slug}`} target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-primary
                       hover:bg-tag rounded-xl transition">
            <Icon name="link-ext" size={16} />
            查看我的預約頁
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm
                       text-ink-muted hover:bg-bg rounded-xl transition">
            <Icon name="logout" size={16} />
            <span className="truncate">{session.user.name}，登出</span>
          </button>
        </div>
      </aside>

      {/* ── Main content (full width) ── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3
                        bg-white border-b border-tag w-full">
          <LogoText size="sm" href="/dashboard" />
          <Link href={`/${session.user.slug}`} target="_blank"
            className="text-sm text-primary font-medium flex items-center gap-1">
            <Icon name="link-ext" size={15} />
            預約頁
          </Link>
        </div>

        {/* Page content — full 12-col width */}
        <main className="flex-1 overflow-auto w-full">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white border-t border-tag flex safe-area-pb">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1
                          text-xs font-medium transition relative ${
                active ? 'text-accent' : 'text-ink-muted'
              }`}>
              <span className="relative">
                <Icon name={item.icon} size={22}
                  className={active ? 'text-primary' : 'text-ink-muted'} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1
                                   bg-red-500 text-white text-[10px] font-bold rounded-full
                                   flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
