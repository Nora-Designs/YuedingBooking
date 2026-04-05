import Link from 'next/link'
import Icon from '@/components/Icon'
import { LogoText } from '@/components/Logo'

/* ── Decorative vertical side-rule component ── */
function SideRule({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`
      hidden lg:flex flex-col items-center gap-0
      fixed top-0 bottom-0 z-0 pointer-events-none
      ${side === 'left' ? 'left-7' : 'right-7'}
    `}>
      {/* top diamond */}
      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-primary-light mt-10 shrink-0"
        fill="currentColor">
        <polygon points="6,0 12,6 6,12 0,6" />
      </svg>
      {/* top line */}
      <div className="w-px flex-1 max-h-24 bg-gradient-to-b from-transparent to-primary-light" />
      {/* middle section */}
      <div className="w-px flex-1 bg-primary-light opacity-40" />
      {/* middle diamond */}
      <svg viewBox="0 0 8 8" className="w-2 h-2 text-primary-light shrink-0 my-1"
        fill="none" stroke="currentColor" strokeWidth="1">
        <polygon points="4,0 8,4 4,8 0,4" />
      </svg>
      <div className="w-px flex-1 bg-primary-light opacity-40" />
      {/* bottom line */}
      <div className="w-px flex-1 max-h-24 bg-gradient-to-t from-transparent to-primary-light" />
      {/* bottom diamond */}
      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-primary-light mb-10 shrink-0"
        fill="currentColor">
        <polygon points="6,0 12,6 6,12 0,6" />
      </svg>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-x-hidden">

      {/* ── Side decorative lines ── */}
      <SideRule side="left" />
      <SideRule side="right" />

      {/* ── Sticky nav wrapper ── */}
      <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-tag/50">
        <nav className="flex items-center justify-between
                        px-6 py-4 max-w-5xl mx-auto w-full">
          <LogoText size="sm" />
          <div className="flex items-center gap-2">
            <Link href="/auth/login"
              className="px-4 py-2 text-base font-medium text-ink-light hover:text-accent transition">
              登入
            </Link>
            <Link href="/auth/register"
              className="px-5 py-2.5 bg-primary text-white text-base rounded-full
                         font-semibold hover:bg-accent transition shadow-sm">
              免費開始
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center
                          text-center px-5 py-16 max-w-2xl mx-auto w-full">

        {/* top ornament rule */}
        <div className="flex items-center gap-4 mb-10 w-full max-w-xs mx-auto">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-primary-light" />
          <svg viewBox="0 0 14 14" className="w-3 h-3 text-primary" fill="currentColor">
            <polygon points="7,0 14,7 7,14 0,7" />
          </svg>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-primary-light" />
        </div>

        <LogoText size="lg" href="" />

        <h1 className="text-3xl sm:text-5xl font-bold text-ink leading-tight
                       mb-5 text-balance mt-10">
          讓客人直接選時間<br />
          <span className="text-primary">完成預約</span>
        </h1>
        <p className="text-lg text-ink-muted mb-10 max-w-md">
          支援<span className="text-accent font-medium">學員約課</span>與
          <span className="text-accent font-medium">新娘預約</span>，
          分享連結，3步搞定。
        </p>

        <Link href="/auth/register"
          className="px-8 py-4 bg-primary text-white text-lg rounded-full
                     font-bold hover:bg-accent transition shadow-md">
          免費建立我的預約頁
        </Link>

        {/* bottom ornament rule */}
        <div className="flex items-center gap-4 mt-14 w-full max-w-xs mx-auto">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-primary-light" />
          <svg viewBox="0 0 14 14" className="w-3 h-3 text-primary-light" fill="currentColor">
            <polygon points="7,0 14,7 7,14 0,7" />
          </svg>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-primary-light" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-12 w-full">

        {/* section heading rule */}
        <div className="flex items-center gap-4 mb-8">
          <span className="flex-1 h-px bg-tag" />
          <span className="text-sm text-ink-muted font-medium tracking-widest uppercase">
            功能特色
          </span>
          <span className="flex-1 h-px bg-tag" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-tag p-6 space-y-4">
            <h3 className="font-bold text-ink text-lg">兩種預約模式</h3>
            {[
              { icon: <Icon name="graduation" size={20} className="text-primary" />, t: '學員約課', d: '技術課程、補課、一對一 / 團體教學' },
              { icon: <Icon name="ring" size={20} className="text-primary" />, t: '新娘預約', d: '婚禮造型、試妝、正式服務' },
            ].map((i) => (
              <div key={i.t} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-tag flex items-center
                                 justify-center shrink-0">{i.icon}</span>
                <div>
                  <p className="font-semibold text-ink">{i.t}</p>
                  <p className="text-ink-muted text-sm mt-0.5">{i.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-tag p-6 space-y-3">
            <h3 className="font-bold text-ink text-lg">智慧衝突提醒</h3>
            <p className="text-ink-muted">
              若新娘想預約已被學員佔用的日期，系統自動通知老師協調，不讓任何預約白白流失。
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-sm text-ink-muted">衝突日期後台醒目標示</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-tag p-6 sm:col-span-2">
            <h3 className="font-bold text-ink text-lg mb-5">3 步完成預約</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: '01', t: '老師設定檔期', d: '分別設定學員和新娘的可預約日' },
                { n: '02', t: '分享連結',     d: '客人選類型 → 選服務 → 選日期' },
                { n: '03', t: '即時通知',     d: 'Email 通知老師，3步完成' },
              ].map((s, i) => (
                <div key={s.n} className="text-center relative">
                  {/* connector line between steps */}
                  {i < 2 && (
                    <span className="hidden sm:block absolute top-4 left-[60%] right-0
                                     h-px bg-tag" />
                  )}
                  <div className="text-2xl font-bold text-primary-light font-serif mb-2">
                    {s.n}
                  </div>
                  <div className="font-semibold text-ink">{s.t}</div>
                  <div className="text-sm text-ink-muted mt-0.5">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-5 border-t border-tag">
        <p className="text-ink-muted text-sm">© 2026 i 客</p>
      </footer>
    </div>
  )
}
