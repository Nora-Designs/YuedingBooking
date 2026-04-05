'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import Image from 'next/image'
import { LogoText } from '@/components/Logo'
import Icon from '@/components/Icon'
import 'react-day-picker/dist/style.css'

interface Teacher {
  id: string; name: string; bio?: string | null
  price?: string | null; showPrices: boolean
  images: string[]; slug: string
}
interface AvailDay  { date: string; forType: string; status: string }
interface Service   { id: string; name: string; description?: string | null
                      price?: string | null; showPrice: boolean; serviceType: string }
interface Props {
  teacher: Teacher
  availability: AvailDay[]
  services: Service[]
}

type Step        = 'type' | 'service' | 'calendar' | 'form' | 'done'
type BookingType = 'student' | 'bridal'

const bookingTypes = [
  { key: 'student' as BookingType, icon: 'student' as const, title: '學員約課',
    desc: '技術課程、補課、一對一 / 團體教學',
    border: 'border-blue-200', activeBorder: 'border-blue-400 ring-2 ring-blue-200' },
  { key: 'bridal' as BookingType, icon: 'bridal' as const, title: '新娘預約',
    desc: '婚禮造型、試妝、正式服務',
    border: 'border-pink-200', activeBorder: 'border-pink-400 ring-2 ring-pink-200' },
]

export default function TeacherBookingClient({ teacher, availability, services }: Props) {
  const [step,         setStep]         = useState<Step>('type')
  const [bookingType,  setBookingType]  = useState<BookingType | null>(null)
  const [selectedSvc,  setSelectedSvc]  = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [form, setForm] = useState({
    name: '', contact: '', email: '', note: '',
    // Student
    learnTarget: '',
    // Bridal (legacy)
    weddingDate: '', serviceContent: '',
    // Bridal (new)
    bridalPhone: '', numDresses: '', banquetType: '',
    needsFollowUp: null as boolean | null,
    needsTrial: null as boolean | null,
    venueLocation: '', banquetTime: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [doneId,     setDoneId]     = useState<string | null>(null)
  const [error,      setError]      = useState('')

  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Availability filtered by booking type
  const typeAvail = availability.filter((d) => d.forType === bookingType)
  const availableDates = typeAvail.filter((d) => d.status === 'available').map((d) => parseISO(d.date))
  // For bridal: student-booked dates are "conflict possible" (yellow)
  const bookedByStudent = availability.filter((d) => d.forType === 'student' && d.status === 'booked')
    .map((d) => parseISO(d.date))

  const relevantServices = services.filter((s) => {
    if (bookingType === 'student') return ['individual', 'group'].includes(s.serviceType)
    if (bookingType === 'bridal')  return s.serviceType === 'bridal'
    return false
  })

  const isConflictDate = selectedDate &&
    availability.find((d) => d.date === format(selectedDate, 'yyyy-MM-dd') &&
      d.forType === 'student' && d.status === 'booked') !== undefined &&
    bookingType === 'bridal'

  function handleDayClick(day: Date) {
    const ds = format(day, 'yyyy-MM-dd')
    const avail = typeAvail.find((d) => d.date === ds)
    if (avail?.status === 'available') {
      setSelectedDate(day); setStep('form')
    } else if (bookingType === 'bridal' && !avail) {
      // Check if student-booked
      const studentBooked = availability.find((d) => d.date === ds && d.forType === 'student' && d.status === 'booked')
      if (studentBooked) { setSelectedDate(day); setStep('form') }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !bookingType) return
    setError(''); setSubmitting(true)

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherId: teacher.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        customerName: form.name,
        customerContact: bookingType === 'student' ? form.email : form.bridalPhone,
        note: form.note || null,
        bookingType,
        serviceId: selectedSvc?.id || null,
        learnTarget: form.learnTarget || null,
        weddingDate: form.weddingDate || null,
        serviceContent: form.serviceContent || null,
        bridalPhone: form.bridalPhone || null,
        numDresses: form.numDresses || null,
        banquetType: form.banquetType || null,
        needsFollowUp: form.needsFollowUp,
        needsTrial: form.needsTrial,
        venueLocation: form.venueLocation || null,
        banquetTime: form.banquetTime || null,
      }),
    })

    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error || '預約失敗，請再試一次'); return }
    setDoneId(data.id)
    setStep('done')
  }

  function reset() {
    setStep('type'); setBookingType(null); setSelectedSvc(null)
    setSelectedDate(null); setDoneId(null)
    setForm({ name: '', contact: '', email: '', note: '', learnTarget: '', weddingDate: '', serviceContent: '', bridalPhone: '', numDresses: '', banquetType: '', needsFollowUp: null, needsTrial: null, venueLocation: '', banquetTime: '' })
  }

  const inp = 'w-full border border-tag rounded-xl px-4 py-3 text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary/40 text-base'
  const lbl = 'block text-sm font-semibold text-ink-light mb-1.5 uppercase tracking-wide'

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="flex items-center justify-center px-5 py-4 border-b border-tag bg-white">
        <LogoText size="sm" href="/" />
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Teacher profile header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ink font-serif">{teacher.name}</h1>
          {teacher.bio && (
            <p className="text-ink-muted mt-2 whitespace-pre-line max-w-sm mx-auto">{teacher.bio}</p>
          )}
          {teacher.showPrices && teacher.price ? (
            <span className="inline-block mt-3 px-4 py-1.5 bg-tag text-accent rounded-full font-semibold">
              {teacher.price}
            </span>
          ) : !teacher.showPrices ? (
            <span className="inline-block mt-3 px-4 py-1.5 bg-tag text-ink-muted rounded-full text-sm">
              歡迎詢問
            </span>
          ) : null}
        </div>

        {/* Portfolio */}
        {teacher.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {teacher.images.slice(0, 6).map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-tag relative">
                <Image src={url} alt={`作品${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: Type ── */}
        {step === 'type' && (
          <div className="bg-white rounded-2xl border border-tag p-6">
            <h2 className="font-bold text-ink text-lg mb-4">請選擇預約類型</h2>
            <div className="grid grid-cols-2 gap-3">
              {bookingTypes.map((t) => (
                <button key={t.key}
                  onClick={() => {
                    setBookingType(t.key)
                    // If there are services for this type, go to service step
                    const hasSvc = services.some((s) =>
                      t.key === 'student' ? ['individual', 'group'].includes(s.serviceType) : s.serviceType === 'bridal'
                    )
                    setStep(hasSvc ? 'service' : 'calendar')
                  }}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2
                              text-center hover:scale-[1.02] active:scale-100 transition ${t.border} bg-bg`}>
                  <span className="text-3xl flex items-center justify-center">
                    {t.key === 'student'
                      ? <Icon name="graduation" size={32} className="text-blue-500" />
                      : <Icon name="ring" size={32} className="text-pink-500" />
                    }
                  </span>
                  <span className="font-bold text-ink">{t.title}</span>
                  <span className="text-sm text-ink-muted leading-snug">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Service ── */}
        {step === 'service' && (
          <div className="bg-white rounded-2xl border border-tag p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">選擇服務</h2>
              <button onClick={() => setStep('type')} className="text-sm text-ink-muted hover:text-accent">← 返回</button>
            </div>
            <div className="space-y-2">
              {relevantServices.map((s) => (
                <button key={s.id}
                  onClick={() => { setSelectedSvc(s); setStep('calendar') }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2
                              text-left transition hover:border-primary/40 ${
                    selectedSvc?.id === s.id ? 'border-primary bg-tag' : 'border-tag bg-bg'
                  }`}>
                  <div>
                    <p className="font-semibold text-ink">{s.name}</p>
                    {s.description && <p className="text-sm text-ink-muted mt-0.5">{s.description}</p>}
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    {s.showPrice && s.price ? (
                      <span className="text-primary font-semibold">{s.price}</span>
                    ) : (
                      <span className="text-sm text-ink-muted">歡迎詢問</span>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setSelectedSvc(null); setStep('calendar') }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-tag
                           text-ink-muted text-sm hover:border-primary/30 transition">
                不指定服務，直接選日期
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Calendar ── */}
        {step === 'calendar' && (
          <div className="bg-white rounded-2xl border border-tag p-5 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">選擇日期</h2>
              <button onClick={() => setStep(relevantServices.length > 0 ? 'service' : 'type')}
                className="text-sm text-ink-muted hover:text-accent">← 返回</button>
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {bookingType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tag text-accent rounded-full text-sm font-semibold">
                  {bookingType === 'student'
                    ? <Icon name="graduation" size={14} className="text-blue-500" />
                    : <Icon name="ring" size={14} className="text-pink-500" />
                  }
                  {bookingTypes.find((t) => t.key === bookingType)?.title}
                </span>
              )}
              {selectedSvc && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tag text-accent rounded-full text-sm font-semibold">
                  {selectedSvc.name}
                </span>
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-200" />可預約</span>
              {bookingType === 'bridal' && (
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-200" />有學員課（可搶先預約）</span>
              )}
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-200" />已被預約</span>
            </div>
            <div className="w-full">
              <DayPicker
                mode="single" locale={zhTW}
                selected={selectedDate ?? undefined}
                onDayClick={handleDayClick}
                disabled={(date) => {
                  if (date < today) return true
                  const ds = format(date, 'yyyy-MM-dd')
                  const avail = typeAvail.find((d) => d.date === ds)
                  if (avail?.status === 'available') return false
                  if (!avail && bookingType === 'bridal') {
                    const sb = availability.find((d) => d.date === ds && d.forType === 'student' && d.status === 'booked')
                    if (sb) return false
                  }
                  return true
                }}
                modifiers={{ available: availableDates, conflict: bookedByStudent }}
                modifiersClassNames={{ available: 'day-available', conflict: bookingType === 'bridal' ? 'day-conflict' : 'day-booked' }}
              />
            </div>
            {availableDates.length === 0 && (
              <p className="text-center text-ink-muted text-sm mt-4">目前尚無開放日期，請稍後查看</p>
            )}
          </div>
        )}

        {/* ── STEP 4: Form ── */}
        {step === 'form' && selectedDate && (
          <div className="bg-white rounded-2xl border border-tag p-6">
            <button onClick={() => setStep('calendar')}
              className="text-sm text-ink-muted hover:text-accent mb-4 flex items-center gap-1">
              ← 返回
            </button>
            <h2 className="font-bold text-ink text-lg mb-2">填寫預約資料</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-3 py-1 bg-tag text-accent rounded-full text-sm font-semibold">
                📅 {format(selectedDate, 'yyyy年 M月 d日（EEEE）', { locale: zhTW })}
              </span>
              {bookingType && (
                <span className="px-3 py-1 bg-tag text-accent rounded-full text-sm font-semibold inline-flex items-center gap-1">
                  {bookingType === 'student'
                    ? <Icon name="graduation" size={14} className="text-blue-500" />
                    : <Icon name="ring" size={14} className="text-pink-500" />
                  }{' '}
                  {bookingTypes.find((t) => t.key === bookingType)?.title}
                </span>
              )}
              {selectedSvc && (
                <span className="px-3 py-1 bg-tag text-accent rounded-full text-sm font-semibold">
                  {selectedSvc.name}
                </span>
              )}
            </div>

            {/* Conflict warning */}
            {isConflictDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-amber-800 font-semibold mb-1">⚠️ 此日期已有學員課程</p>
                <p className="text-amber-700 text-sm">
                  送出後老師將收到衝突通知，並與學員協調換日。確認後你的預約正式成立。
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={lbl}>姓名 <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} required className={inp}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="你的姓名" />
              </div>

              {/* Student: email required */}
              {bookingType === 'student' && (
                <div>
                  <label className={lbl}>Email <span className="text-red-400">*</span></label>
                  <input type="email" value={form.email} required className={inp}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com" />
                  <p className="text-xs text-ink-muted mt-1.5">用於預約確認通知</p>
                </div>
              )}

              {/* Student-specific */}
              {bookingType === 'student' && (
                <div>
                  <label className={lbl}>想學的技術 / 課程目標</label>
                  <textarea value={form.learnTarget} rows={2} className={inp + ' resize-none'}
                    onChange={(e) => setForm((p) => ({ ...p, learnTarget: e.target.value }))}
                    placeholder="想學什麼髮型、妝容，或這次想專攻的技術..." />
                </div>
              )}

              {/* Bridal-specific */}
              {bookingType === 'bridal' && (
                <>
                  {/* 聯絡電話 */}
                  <div>
                    <label className={lbl}>聯絡電話 <span className="text-red-400">*</span></label>
                    <input type="tel" value={form.bridalPhone} required className={inp}
                      onChange={(e) => setForm((p) => ({ ...p, bridalPhone: e.target.value }))}
                      placeholder="0912-345-678" />
                  </div>

                  {/* 幾套禮服 */}
                  <div>
                    <label className={lbl}>幾套禮服</label>
                    <input type="text" value={form.numDresses} className={inp}
                      onChange={(e) => setForm((p) => ({ ...p, numDresses: e.target.value }))}
                      placeholder="例：3套" />
                  </div>

                  {/* 宴席類型 */}
                  <div>
                    <label className={lbl}>宴席類型</label>
                    <select value={form.banquetType} className={inp}
                      onChange={(e) => setForm((p) => ({ ...p, banquetType: e.target.value }))}>
                      <option value="">請選擇</option>
                      <option value="早宴">早宴</option>
                      <option value="午宴">午宴</option>
                      <option value="晚宴">晚宴</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>

                  {/* 是否需要跟妝 */}
                  <div>
                    <label className={lbl}>是否需要跟妝</label>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setForm(p => ({ ...p, needsFollowUp: true }))}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                          form.needsFollowUp === true
                            ? 'border-primary bg-tag text-accent'
                            : 'border-tag bg-white text-ink-muted'
                        }`}>是</button>
                      <button type="button"
                        onClick={() => setForm(p => ({ ...p, needsFollowUp: false }))}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                          form.needsFollowUp === false
                            ? 'border-primary bg-tag text-accent'
                            : 'border-tag bg-white text-ink-muted'
                        }`}>否</button>
                    </div>
                  </div>

                  {/* 是否需要試妝 */}
                  <div>
                    <label className={lbl}>是否需要試妝</label>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setForm(p => ({ ...p, needsTrial: true }))}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                          form.needsTrial === true
                            ? 'border-primary bg-tag text-accent'
                            : 'border-tag bg-white text-ink-muted'
                        }`}>是</button>
                      <button type="button"
                        onClick={() => setForm(p => ({ ...p, needsTrial: false }))}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                          form.needsTrial === false
                            ? 'border-primary bg-tag text-accent'
                            : 'border-tag bg-white text-ink-muted'
                        }`}>否</button>
                    </div>
                  </div>

                  {/* 婚宴地點 */}
                  <div>
                    <label className={lbl}>婚宴地點</label>
                    <input type="text" value={form.venueLocation} className={inp}
                      onChange={(e) => setForm((p) => ({ ...p, venueLocation: e.target.value }))}
                      placeholder="例：台北喜來登大飯店" />
                  </div>

                  {/* 婚宴時間 */}
                  <div>
                    <label className={lbl}>婚宴時間</label>
                    <input type="text" value={form.banquetTime} className={inp}
                      onChange={(e) => setForm((p) => ({ ...p, banquetTime: e.target.value }))}
                      placeholder="例：10:00" />
                  </div>

                  {/* 婚禮日期 */}
                  <div>
                    <label className={lbl}>婚禮日期</label>
                    <input type="date" value={form.weddingDate} className={inp}
                      onChange={(e) => setForm((p) => ({ ...p, weddingDate: e.target.value }))} />
                  </div>

                  {/* 其他需求 */}
                  <div>
                    <label className={lbl}>其他需求</label>
                    <textarea value={form.note} rows={2} className={inp + ' resize-none'}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="其他想告知老師的事..." />
                  </div>
                </>
              )}

              {/* Student note (shown outside bridal block) */}
              {bookingType === 'student' && (
                <div>
                  <label className={lbl}>備註</label>
                  <textarea value={form.note} rows={2} className={inp + ' resize-none'}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder="其他想告知老師的事..." />
                </div>
              )}

              {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">{error}</p>}

              <button type="submit" disabled={submitting}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg
                           hover:bg-accent transition disabled:opacity-60">
                {submitting ? '送出中...' : isConflictDate ? '確認送出（新娘優先預約）' : '確認預約'}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 5: Done ── */}
        {step === 'done' && selectedDate && (
          <div className="bg-white rounded-2xl border border-tag p-8 text-center">
            <div className="text-5xl mb-4 flex justify-center">
              {bookingType === 'bridal'
                ? <Icon name="ring" size={48} className="text-pink-500" />
                : <span>🎉</span>
              }
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">
              {isConflictDate ? '預約已送出，等待確認' : '預約成功！'}
            </h2>
            <p className="text-ink-muted mb-2">
              {format(selectedDate, 'yyyy年 M月 d日', { locale: zhTW })}
            </p>
            {isConflictDate ? (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 mb-4">
                老師將協調學員換日，確認後以你留的聯絡方式通知你。
              </p>
            ) : (
              <p className="text-ink-muted text-sm mb-4">老師確認後會透過你留的聯絡方式通知你</p>
            )}

            {/* View / cancel link */}
            {doneId && (
              <div className="mb-6 p-4 bg-bg border border-tag rounded-xl space-y-2">
                <p className="text-sm text-ink-muted">請儲存以下連結，隨時查看或取消預約：</p>
                <a href={`/booking/${doneId}`}
                  className="block w-full py-2.5 bg-primary text-white rounded-xl font-semibold
                             text-sm text-center hover:bg-accent transition">
                  查看我的預約 →
                </a>
                <a href={`/booking/${doneId}`}
                  onClick={(e) => {
                    e.preventDefault()
                    navigator.clipboard?.writeText(`${window.location.origin}/booking/${doneId}`)
                      .then(() => alert('連結已複製！'))
                      .catch(() => {})
                  }}
                  className="block w-full py-2 border border-tag rounded-xl text-ink-muted
                             text-sm text-center hover:bg-tag transition cursor-pointer">
                  複製預約連結
                </a>
              </div>
            )}

            <button onClick={reset} className="text-primary font-semibold hover:underline text-sm">
              再次預約
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
