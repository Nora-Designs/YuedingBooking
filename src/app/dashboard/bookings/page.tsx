'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import Icon from '@/components/Icon'

interface Booking {
  id: string; date: string
  customerName: string; customerContact: string
  note?: string | null
  bookingType: 'student' | 'bridal'
  status: 'pending' | 'confirmed' | 'cancelled' | 'conflict_pending' | 'conflict_resolved'
  serviceId?: string | null
  classNumber?: number | null; lessonContent?: string | null; learnTarget?: string | null
  deposit?: string | null; weddingDate?: string | null; serviceContent?: string | null
  bridalPhone?: string | null; numDresses?: string | null; banquetType?: string | null
  needsFollowUp?: boolean | null; needsTrial?: boolean | null
  venueLocation?: string | null; banquetTime?: string | null
  createdAt: string
}

type FilterType = 'all' | 'student' | 'bridal' | 'conflict_pending' | 'pending'

const statusCfg = {
  pending:           { label: '待確認',  cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  confirmed:         { label: '已確認',  cls: 'bg-green-50  text-green-700  border-green-200' },
  cancelled:         { label: '已取消',  cls: 'bg-gray-50   text-gray-400   border-gray-200'  },
  conflict_pending:  { label: '⚠ 衝突', cls: 'bg-red-50    text-red-700    border-red-300'   },
  conflict_resolved: { label: '已處理',  cls: 'bg-gray-50   text-gray-400   border-gray-200'  },
}

function BookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Booking>>({})
  const [calView,  setCalView]  = useState(false)
  const [selDate,  setSelDate]  = useState<Date | undefined>(undefined)

  const [search,   setSearch]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const searchParams  = useSearchParams()
  const defaultFilter = (searchParams.get('filter') as FilterType) || 'all'
  const [filter, setFilter] = useState<FilterType>(defaultFilter)

  const PAGE_SIZE = 15
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [search, dateFrom, dateTo, filter, selDate])

  useEffect(() => {
    fetch('/api/bookings', { cache: 'no-store' })
      .then((r) => r.json()).then(setBookings).finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, ...updated } : b))
    }
  }

  async function saveTeacherNotes(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, ...editData } : b))
    setEditId(null); setEditData({})
  }

  async function resolveConflict(bridalId: string, date: string) {
    const student = bookings.find(
      (b) => b.date === date && b.bookingType === 'student' &&
             ['pending', 'confirmed'].includes(b.status)
    )
    if (student) {
      await fetch(`/api/bookings/${student.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      setBookings((prev) => prev.map((b) => b.id === student.id ? { ...b, status: 'cancelled' } : b))
    }
    await updateStatus(bridalId, 'confirmed')
  }

  const conflictCount = bookings.filter((b) => b.status === 'conflict_pending').length
  const pendingCount  = bookings.filter((b) => b.status === 'pending').length
  const studentCount  = bookings.filter((b) => b.bookingType === 'student' && b.status !== 'cancelled').length
  const bridalCount   = bookings.filter((b) => b.bookingType === 'bridal'  && b.status !== 'cancelled').length

  // Dates that have bookings (for calendar dots)
  const studentBookingDates = bookings
    .filter((b) => b.bookingType === 'student' && !['cancelled','conflict_resolved'].includes(b.status))
    .map((b) => parseISO(b.date))
  const bridalBookingDates = bookings
    .filter((b) => b.bookingType === 'bridal' && !['cancelled','conflict_resolved'].includes(b.status))
    .map((b) => parseISO(b.date))

  const selDateStr = selDate ? format(selDate, 'yyyy-MM-dd') : null

  const filtered = bookings.filter((b) => {
    // Calendar date filter
    if (selDateStr && b.date !== selDateStr) return false
    // Date range filter
    if (dateFrom && b.date < dateFrom) return false
    if (dateTo   && b.date > dateTo)   return false
    // Fuzzy search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const nameMatch    = b.customerName.toLowerCase().includes(q)
      const contactMatch = (b.customerContact || '').toLowerCase().includes(q)
      const phoneMatch   = (b.bridalPhone     || '').toLowerCase().includes(q)
      if (!nameMatch && !contactMatch && !phoneMatch) return false
    }
    // Tab filter
    if (filter === 'all')              return !['cancelled', 'conflict_resolved'].includes(b.status)
    if (filter === 'student')          return b.bookingType === 'student' && b.status !== 'cancelled'
    if (filter === 'bridal')           return b.bookingType === 'bridal'  && b.status !== 'cancelled'
    if (filter === 'conflict_pending') return b.status === 'conflict_pending'
    if (filter === 'pending')          return b.status === 'pending'
    return true
  }).sort((a, b) => a.date.localeCompare(b.date))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tabs: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all',              label: '全部'     },
    { key: 'student',          label: '學員',   count: studentCount  },
    { key: 'bridal',           label: '新娘',   count: bridalCount   },
    { key: 'conflict_pending', label: '衝突',   count: conflictCount },
    { key: 'pending',          label: '待確認', count: pendingCount  },
  ]

  return (
    <div className="p-6 sm:p-8 w-full">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">預約名單</h1>
          <p className="text-ink-muted mt-1">學員課程與新娘預約一覽</p>
        </div>
        {/* Calendar view toggle */}
        <button
          onClick={() => setCalView((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition ${
            calView ? 'bg-primary text-white border-primary' : 'bg-white text-ink-muted border-tag hover:border-primary/40'
          }`}>
          <Icon name="time" size={16} />
          月曆檢視
        </button>
      </div>

      {/* Search + date range */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜尋姓名、電話..."
          className="flex-1 min-w-48 border border-tag rounded-xl px-4 py-2.5 text-base bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary/40 text-ink" />
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-tag rounded-xl px-3 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary/40 text-ink" />
          <span className="text-ink-muted text-sm">至</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-tag rounded-xl px-3 py-2.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary/40 text-ink" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-sm text-ink-muted hover:text-accent px-2 py-1 rounded-lg hover:bg-bg transition">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Conflict banner */}
      {conflictCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-5">
          <p className="font-semibold text-red-700 flex items-center gap-2">
            <Icon name="warning" size={18} className="text-red-500" /> 有 {conflictCount} 筆新娘預約與學員課程衝突
          </p>
          <p className="text-red-500 text-sm mt-1">請先聯絡學員協調換日，再按「確認新娘 / 取消學員課」</p>
        </div>
      )}

      {/* Calendar view */}
      {calView && (
        <div className="bg-white rounded-2xl border border-tag p-5 mb-5 w-full">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-ink-muted">學員預約</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-400" />
              <span className="text-ink-muted">新娘預約</span>
            </span>
            {selDate && (
              <button onClick={() => setSelDate(undefined)}
                className="ml-auto flex items-center gap-1 text-sm text-primary hover:text-accent">
                <Icon name="x" size={14} /> 清除日期篩選
              </button>
            )}
          </div>
          <DayPicker
            mode="single"
            locale={zhTW}
            selected={selDate}
            onSelect={setSelDate}
            numberOfMonths={2}
            modifiers={{ studentDay: studentBookingDates, bridalDay: bridalBookingDates }}
            modifiersStyles={{
              studentDay: { fontWeight: 700 },
              bridalDay:  {},
            }}
            components={{
              DayContent: ({ date }) => {
                const ds = format(date, 'yyyy-MM-dd')
                const hasStudent = bookings.some((b) => b.date === ds && b.bookingType === 'student' && !['cancelled','conflict_resolved'].includes(b.status))
                const hasBridal  = bookings.some((b) => b.date === ds && b.bookingType === 'bridal'  && !['cancelled','conflict_resolved'].includes(b.status))
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
              },
            }}
            className="w-full"
          />
          {selDate && (
            <p className="text-sm text-primary font-semibold mt-3 border-t border-tag pt-3">
              顯示 {format(selDate, 'yyyy年 M月 d日', { locale: zhTW })} 的預約
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-medium transition border ${
              filter === t.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-ink-muted border-tag hover:border-primary/40'
            }`}>
            {t.key === 'student' && <Icon name="graduation" size={14} className={filter === t.key ? 'text-white' : 'text-blue-500'} />}
            {t.key === 'bridal'  && <Icon name="ring"       size={14} className={filter === t.key ? 'text-white' : 'text-pink-500'} />}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === t.key ? 'bg-white/20' : 'bg-tag text-accent'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-ink-muted py-12 text-center animate-pulse">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-tag py-14 text-center text-ink-muted">
          沒有符合的預約
        </div>
      ) : (
        <div className="space-y-3 w-full">
          {paged.map((b) => {
            const isConflict = b.status === 'conflict_pending'
            const isExpanded = expanded === b.id
            const isEditing  = editId === b.id
            const student = isConflict
              ? bookings.find((x) => x.date === b.date && x.bookingType === 'student'
                  && ['pending', 'confirmed'].includes(x.status))
              : null

            return (
              <div key={b.id}
                className={`bg-white rounded-2xl border transition ${
                  isConflict ? 'border-red-300 shadow-sm shadow-red-50' : 'border-tag'
                }`}>
                {/* Main row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    {/* Left info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-ink text-base">{b.customerName}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                          b.bookingType === 'bridal'
                            ? 'bg-pink-50 text-pink-700 border-pink-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {b.bookingType === 'bridal'
                            ? <Icon name="ring"       size={11} />
                            : <Icon name="graduation" size={11} />}
                          {b.bookingType === 'bridal' ? '新娘' : '學員'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg[b.status].cls}`}>
                          {statusCfg[b.status].label}
                        </span>
                      </div>
                      <p className="text-primary font-semibold">
                        {format(parseISO(b.date), 'yyyy年 M月 d日（EEEE）', { locale: zhTW })}
                      </p>
                      <p className="text-ink-muted text-sm mt-0.5">
                        {b.bookingType === 'bridal' && b.bridalPhone
                          ? <span className="flex items-center gap-1"><Icon name="phone" size={13} />{b.bridalPhone}</span>
                          : b.customerContact}
                      </p>
                      {/* Bridal venue/time summary */}
                      {b.bookingType === 'bridal' && (b.venueLocation || b.banquetTime) && (
                        <p className="text-ink-muted text-sm mt-0.5 flex items-center gap-3 flex-wrap">
                          {b.venueLocation && (
                            <span className="flex items-center gap-1">
                              <Icon name="map-pin" size={13} className="text-primary" />{b.venueLocation}
                            </span>
                          )}
                          {b.banquetTime && (
                            <span className="flex items-center gap-1">
                              <Icon name="clock" size={13} className="text-primary" />{b.banquetTime}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setExpanded(isExpanded ? null : b.id)}
                        className="flex items-center gap-1 text-sm text-ink-muted
                                   hover:text-accent px-3 py-1.5 rounded-lg
                                   border border-tag hover:border-primary/30 transition">
                        {isExpanded ? '收起' : '詳情'}
                        <Icon name="chevron-right" size={14}
                          className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {isConflict && (
                      <>
                        <button onClick={() => resolveConflict(b.id, b.date)}
                          className="px-4 py-2 bg-primary text-white text-sm rounded-xl font-semibold hover:bg-accent transition">
                          <Icon name="check" size={14} className="inline mr-1" />確認新娘 / 取消學員課
                        </button>
                        <button onClick={() => updateStatus(b.id, 'cancelled')}
                          className="px-4 py-2 bg-white border border-tag text-ink-muted text-sm rounded-xl font-semibold hover:bg-bg transition">
                          婉拒新娘
                        </button>
                      </>
                    )}
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b.id, 'confirmed')}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-xl font-semibold hover:bg-green-600 transition">
                          確認
                        </button>
                        <button onClick={() => updateStatus(b.id, 'cancelled')}
                          className="px-4 py-2 bg-white border border-tag text-ink-muted text-sm rounded-xl font-semibold hover:bg-bg transition">
                          取消
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => updateStatus(b.id, 'cancelled')}
                        className="px-4 py-2 bg-white border border-tag text-ink-muted text-sm rounded-xl font-semibold hover:bg-bg transition">
                        取消預約
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-tag px-5 py-4 bg-bg rounded-b-2xl space-y-4">

                    {/* Conflict info */}
                    {isConflict && student && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm">
                        <p className="font-semibold text-amber-800 mb-1">衝突學員資訊</p>
                        <p className="text-amber-700">姓名：{student.customerName}</p>
                        <p className="text-amber-700">聯絡：{student.customerContact}</p>
                        <p className="text-amber-600 mt-2 text-xs">請先聯絡學員協調換日，確認後按上方按鈕處理。</p>
                      </div>
                    )}

                    {/* Customer fields */}
                    {b.bookingType === 'student' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {b.learnTarget && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">想學的技術 / 目標</p>
                            <p className="text-ink font-medium">{b.learnTarget}</p>
                          </div>
                        )}
                        {b.note && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">備註</p>
                            <p className="text-ink">{b.note}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {b.bookingType === 'bridal' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {b.bridalPhone && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5 flex items-center gap-1"><Icon name="phone" size={11} />聯絡電話</p>
                            <p className="text-ink font-medium">{b.bridalPhone}</p>
                          </div>
                        )}
                        {b.weddingDate && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">婚禮日期</p>
                            <p className="text-ink font-medium">{b.weddingDate}</p>
                          </div>
                        )}
                        {b.venueLocation && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5 flex items-center gap-1"><Icon name="map-pin" size={11} />婚宴地點</p>
                            <p className="text-ink font-medium">{b.venueLocation}</p>
                          </div>
                        )}
                        {b.banquetTime && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5 flex items-center gap-1"><Icon name="clock" size={11} />婚宴時間</p>
                            <p className="text-ink font-medium">{b.banquetTime}</p>
                          </div>
                        )}
                        {b.banquetType && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">宴席類型</p>
                            <p className="text-ink font-medium">{b.banquetType}</p>
                          </div>
                        )}
                        {b.numDresses && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">禮服套數</p>
                            <p className="text-ink font-medium">{b.numDresses}</p>
                          </div>
                        )}
                        {b.needsFollowUp !== null && b.needsFollowUp !== undefined && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">跟妝</p>
                            <p className="text-ink font-medium">{b.needsFollowUp ? '需要' : '不需要'}</p>
                          </div>
                        )}
                        {b.needsTrial !== null && b.needsTrial !== undefined && (
                          <div>
                            <p className="text-ink-muted text-xs mb-0.5">試妝</p>
                            <p className="text-ink font-medium">{b.needsTrial ? '需要' : '不需要'}</p>
                          </div>
                        )}
                        {b.serviceContent && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-ink-muted text-xs mb-0.5">需要的服務</p>
                            <p className="text-ink">{b.serviceContent}</p>
                          </div>
                        )}
                        {b.note && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-ink-muted text-xs mb-0.5">其他需求</p>
                            <p className="text-ink">{b.note}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teacher notes */}
                    <div className="border-t border-tag pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-ink">老師備忘（僅你可見）</p>
                        {!isEditing ? (
                          <button onClick={() => {
                            setEditId(b.id)
                            setEditData({
                              classNumber:   b.classNumber  ?? undefined,
                              lessonContent: b.lessonContent ?? undefined,
                              deposit:       b.deposit      ?? undefined,
                            })
                          }} className="flex items-center gap-1 text-sm text-primary hover:text-accent transition">
                            <Icon name="edit" size={14} /> 編輯
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => saveTeacherNotes(b.id)}
                              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition font-semibold">
                              <Icon name="check" size={14} /> 儲存
                            </button>
                            <button onClick={() => { setEditId(null); setEditData({}) }}
                              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition">
                              <Icon name="x" size={14} /> 取消
                            </button>
                          </div>
                        )}
                      </div>

                      {b.bookingType === 'student' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-ink-muted text-xs mb-1">第幾堂課</p>
                            {isEditing ? (
                              <input type="number"
                                value={editData.classNumber ?? ''}
                                onChange={(e) => setEditData((p) => ({ ...p, classNumber: Number(e.target.value) || undefined }))}
                                className="input-base !py-2 !text-sm" placeholder="例：3" />
                            ) : (
                              <p className="text-ink">{b.classNumber ? `第 ${b.classNumber} 堂` : '—'}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-ink-muted text-xs mb-1">上課內容記錄</p>
                            {isEditing ? (
                              <textarea
                                value={editData.lessonContent ?? ''}
                                onChange={(e) => setEditData((p) => ({ ...p, lessonContent: e.target.value }))}
                                className="input-base !py-2 !text-sm resize-none" rows={2}
                                placeholder="本次上課涵蓋的內容..." />
                            ) : (
                              <p className="text-ink">{b.lessonContent || '—'}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-ink-muted text-xs mb-1">收取訂金</p>
                            {isEditing ? (
                              <input type="text"
                                value={editData.deposit ?? ''}
                                onChange={(e) => setEditData((p) => ({ ...p, deposit: e.target.value }))}
                                className="input-base !py-2 !text-sm" placeholder="例：已收 $3,000" />
                            ) : (
                              <p className="text-ink">{b.deposit || '—'}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-5 border-t border-tag">
              <p className="text-sm text-ink-muted">
                共 {filtered.length} 筆，第 {page} / {totalPages} 頁
              </p>
              <div className="flex gap-2 flex-wrap">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl border border-tag text-sm font-medium
                             text-ink-muted hover:bg-bg disabled:opacity-40 transition">
                  上一頁
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const p = start + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition border ${
                        p === page
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-ink-muted border-tag hover:bg-bg'
                      }`}>
                      {p}
                    </button>
                  )
                })}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl border border-tag text-sm font-medium
                             text-ink-muted hover:bg-bg disabled:opacity-40 transition">
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BookingsPage() {
  return <Suspense><BookingsContent /></Suspense>
}
