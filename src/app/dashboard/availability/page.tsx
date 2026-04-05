'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/Icon'
import { DayPicker } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'

type ForType = 'student' | 'bridal'
type ViewTab  = 'student' | 'bridal' | 'combined'

interface AvailDay {
  id: string
  date: string
  forType: ForType
  status: 'available' | 'booked' | 'closed'
}

const tabConfig = {
  student:  { label: '學員檔期', color: 'text-blue-600'  },
  bridal:   { label: '新娘檔期', color: 'text-pink-600'  },
  combined: { label: '綜合月曆', color: 'text-primary'   },
}

export default function AvailabilityPage() {
  const [days,    setDays]    = useState<AvailDay[]>([])
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState<ViewTab>('student')
  const [saving,  setSaving]  = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/availability', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setDays)
      .finally(() => setLoading(false))
  }, [])

  /* ── filtered per-tab ── */
  const studentDays = days.filter((d) => d.forType === 'student')
  const bridalDays  = days.filter((d) => d.forType === 'bridal')
  const tabDays     = view === 'student' ? studentDays : bridalDays

  /* date arrays for DayPicker modifiers (individual tabs) */
  const availableDates = tabDays.filter((d) => d.status === 'available').map((d) => parseISO(d.date))
  const bookedDates    = tabDays.filter((d) => d.status === 'booked').map((d) => parseISO(d.date))
  const closedDates    = tabDays.filter((d) => d.status === 'closed').map((d) => parseISO(d.date))

  /* combined view — unique dates set */
  const allDates = Array.from(new Set(days.map((d) => d.date)))

  function getDayMeta(dateStr: string) {
    const studentAvail = studentDays.find((d) => d.date === dateStr && d.status === 'available')
    const bridalAvail  = bridalDays.find((d) => d.date === dateStr && d.status === 'available')
    return { hasStudent: !!studentAvail, hasBridal: !!bridalAvail }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)

  /* ── toggle handler (individual tabs only) ── */
  async function toggleDay(date: Date) {
    if (view === 'combined') return
    const tab      = view as ForType
    const dateStr  = format(date, 'yyyy-MM-dd')
    const existing = tabDays.find((d) => d.date === dateStr)

    let nextStatus: 'available' | 'closed' | null
    if (!existing)                            nextStatus = 'available'
    else if (existing.status === 'closed')    nextStatus = 'available'
    else if (existing.status === 'available') nextStatus = 'closed'
    else return // booked — no manual toggle

    setSaving(dateStr)

    if (nextStatus === null) {
      await fetch(`/api/availability/${dateStr}?forType=${tab}`, { method: 'DELETE' })
      setDays((prev) => prev.filter((d) => !(d.date === dateStr && d.forType === tab)))
    } else {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, forType: tab, status: nextStatus }),
      })
      const updated = await res.json()
      setDays((prev) => [
        ...prev.filter((d) => !(d.date === dateStr && d.forType === tab)),
        updated,
      ])
    }
    setSaving(null)
  }

  /* ── Combined calendar custom day renderer ── */
  function CombinedDayContent({ date }: { date: Date }) {
    const ds = format(date, 'yyyy-MM-dd')
    const { hasStudent, hasBridal } = getDayMeta(ds)

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{date.getDate()}</span>
        {(hasStudent || hasBridal) && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            {hasStudent && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            {hasBridal  && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">檔期管理</h1>
        <p className="text-ink-muted mt-1">
          分別設定學員和新娘的可預約日期，或切換綜合月曆同時查看
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(tabConfig) as ViewTab[]).map((t) => {
          const cfg   = tabConfig[t]
          const count = t === 'combined'
            ? days.filter((d) => d.status === 'available').length
            : days.filter((d) => d.forType === t && d.status === 'available').length
          return (
            <button key={t} onClick={() => setView(t)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold
                          text-base border transition ${
                view === t
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-ink-muted border-tag hover:border-primary/40'
              }`}>
              <span className="text-xl flex items-center">
                {t === 'student'  && <Icon name="graduation" size={18} className={view === t ? 'text-white' : 'text-blue-500'} />}
                {t === 'bridal'   && <Icon name="ring"       size={18} className={view === t ? 'text-white' : 'text-pink-500'} />}
                {t === 'combined' && <Icon name="time"       size={18} className={view === t ? 'text-white' : 'text-primary'} />}
              </span>
              {cfg.label}
              {t !== 'combined' && (
                <span className={`text-sm px-2 py-0.5 rounded-full ${
                  view === t ? 'bg-white/20 text-white' : 'bg-tag text-accent'
                }`}>
                  {count} 天
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Info box */}
      <div className="bg-white border border-tag rounded-xl px-4 py-3 mb-6 text-sm text-ink-muted flex items-start gap-2">
        <div>
          {view === 'student' && (
            <p>設定你開放給<strong className="text-ink">學員約課</strong>的日期。點擊日期循環切換：可預約 → 關閉。</p>
          )}
          {view === 'bridal' && (
            <p>設定你開放給<strong className="text-ink">新娘預約</strong>的日期。若新娘想預約學員已佔用的日期，系統自動發出衝突通知。</p>
          )}
          {view === 'combined' && (
            <p>同時查看<strong className="text-ink">學員（藍）</strong>與<strong className="text-ink">新娘（粉）</strong>的所有檔期狀況，此檢視為唯讀。</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-ink-muted py-12 text-center animate-pulse">載入中...</div>
      ) : view === 'combined' ? (

        /* ─── Combined view ─── */
        <div className="bg-white rounded-2xl border border-tag p-6 w-full">
          {/* Legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5 text-sm">
            {[
              { dot: 'bg-blue-400', label: '開放給學員' },
              { dot: 'bg-pink-400', label: '開放給新娘' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${item.dot}`} />
                <span className="text-ink-muted">{item.label}</span>
              </div>
            ))}
          </div>

          <DayPicker
            mode="single"
            locale={zhTW}
            selected={undefined}
            onDayClick={() => {}}
            disabled={(date) => date < today}
            numberOfMonths={2}
            className="w-full"
            components={{
              DayContent: ({ date }) => <CombinedDayContent date={date} />,
            }}
          />
          <p className="text-xs text-ink-muted mt-4 border-t border-tag pt-4">
            每格日期下方的點：藍色 ＝ 開放給學員、粉色 ＝ 開放給新娘。
          </p>
        </div>

      ) : (

        /* ─── Individual tab view ─── */
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-5">
            {[
              { dot: 'bg-green-200',  label: '可預約',   sub: '點 1 次' },
              { dot: 'bg-gray-200',   label: '關閉',     sub: '點 2 次' },
              { dot: 'bg-red-200',    label: '已被預約', sub: '客人已訂' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full ${item.dot}`} />
                <span className="text-sm text-ink font-medium">{item.label}</span>
                <span className="text-sm text-ink-muted">({item.sub})</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-tag p-6 w-full">
            <DayPicker
              mode="multiple"
              locale={zhTW}
              selected={availableDates}
              onDayClick={toggleDay}
              disabled={(date) => date < today}
              modifiers={{
                available: availableDates,
                booked:    bookedDates,
                closed:    closedDates,
                saving: saving ? [parseISO(saving)] : [],
              }}
              modifiersClassNames={{
                available: 'day-available',
                booked:    'day-booked',
                closed:    'day-closed',
              }}
              modifiersStyles={{ saving: { opacity: 0.4 } }}
              numberOfMonths={2}
              className="w-full"
            />
            <p className="text-sm text-ink-muted mt-4 border-t border-tag pt-4">
              點擊日期切換：可預約 → 關閉 → 移除。已被預約日（紅色）無法手動更改。
            </p>
          </div>
        </>
      )}
    </div>
  )
}
