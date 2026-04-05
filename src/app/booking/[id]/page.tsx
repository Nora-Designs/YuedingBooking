'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LogoText } from '@/components/Logo'
import Icon from '@/components/Icon'

interface Booking {
  id: string
  date: string
  bookingType: 'student' | 'bridal'
  status: string
  customerName: string
  customerContact: string
  note?: string | null
  weddingDate?: string | null
  banquetType?: string | null
  venueLocation?: string | null
  banquetTime?: string | null
  numDresses?: string | null
  needsFollowUp?: boolean | null
  needsTrial?: boolean | null
  learnTarget?: string | null
  teacherName: string
  teacherSlug: string
  createdAt: string
}

const statusLabel: Record<string, { text: string; color: string }> = {
  pending:          { text: '等待老師確認',     color: 'bg-yellow-100 text-yellow-800' },
  confirmed:        { text: '已確認',           color: 'bg-green-100 text-green-800'  },
  cancelled:        { text: '已取消',           color: 'bg-gray-100 text-gray-500'    },
  conflict_pending: { text: '衝突中，等待協調', color: 'bg-orange-100 text-orange-800'},
  conflict_resolved:{ text: '已解決',           color: 'bg-green-100 text-green-800'  },
}

export default function BookingViewPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [booking, setBooking]     = useState<Booking | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled]   = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetch(`/api/public/bookings/${id}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setBooking(data); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  async function handleCancel() {
    setCancelling(true); setCancelError('')
    const res = await fetch(`/api/public/bookings/${id}/cancel`, { method: 'POST' })
    const data = await res.json()
    setCancelling(false)
    if (!res.ok) { setCancelError(data.error || '取消失敗，請稍後再試'); return }
    setCancelled(true)
    setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev)
    setShowConfirm(false)
  }

  const isBridal  = booking?.bookingType === 'bridal'
  const canCancel = booking && !['cancelled', 'conflict_resolved'].includes(booking.status)

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="text-primary animate-pulse">載入中...</span>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-ink mb-2">找不到此預約</h1>
        <p className="text-ink-muted mb-6">連結可能已過期或無效</p>
        <button onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-accent transition">
          回首頁
        </button>
      </div>
    </div>
  )

  if (!booking) return null

  const st = statusLabel[booking.status] ?? { text: booking.status, color: 'bg-gray-100 text-gray-500' }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="flex items-center justify-center px-5 py-4 border-b border-tag bg-white">
        <LogoText size="sm" href="/" />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-3 flex justify-center">
            {isBridal
              ? <Icon name="ring" size={40} className="text-pink-500" />
              : <Icon name="graduation" size={40} className="text-blue-500" />
            }
          </div>
          <h1 className="text-2xl font-bold text-ink">我的預約</h1>
          <p className="text-ink-muted text-sm mt-1">{booking.teacherName}</p>
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${st.color}`}>
            {st.text}
          </span>
        </div>

        {cancelled && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-semibold">✅ 預約已成功取消</p>
          </div>
        )}

        {/* Detail card */}
        <div className="bg-white rounded-2xl border border-tag p-5 space-y-3">
          <Row icon="time" label="預約日期" value={booking.date} />
          <Row icon={isBridal ? 'ring' : 'graduation'} label="預約類型"
            value={isBridal ? '新娘預約' : '學員約課'} />
          <Row icon="users" label="姓名" value={booking.customerName} />
          <Row icon="phone" label="聯絡方式" value={booking.customerContact} />

          {isBridal && (
            <>
              {booking.weddingDate   && <Row icon="time"    label="婚禮日期" value={booking.weddingDate} />}
              {booking.banquetType   && <Row icon="time"    label="宴席類型" value={booking.banquetType} />}
              {booking.venueLocation && <Row icon="map-pin" label="婚宴地點" value={booking.venueLocation} />}
              {booking.banquetTime   && <Row icon="clock"   label="婚宴時間" value={booking.banquetTime} />}
              {booking.numDresses    && <Row icon="dress"   label="禮服套數" value={booking.numDresses} />}
              {booking.needsFollowUp !== null && (
                <Row icon="ring" label="跟妝" value={booking.needsFollowUp ? '需要' : '不需要'} />
              )}
              {booking.needsTrial !== null && (
                <Row icon="ring" label="試妝" value={booking.needsTrial ? '需要' : '不需要'} />
              )}
            </>
          )}

          {!isBridal && booking.learnTarget && (
            <Row icon="graduation" label="學習目標" value={booking.learnTarget} />
          )}

          {booking.note && <Row icon="settings" label="備註" value={booking.note} />}
        </div>

        {/* Cancel */}
        {canCancel && !cancelled && (
          <div className="bg-white rounded-2xl border border-tag p-5">
            {!showConfirm ? (
              <button onClick={() => setShowConfirm(true)}
                className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500
                           font-semibold hover:bg-red-50 transition">
                取消此預約
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-ink font-semibold">確定要取消此預約嗎？</p>
                <p className="text-center text-ink-muted text-sm">取消後無法復原</p>
                {cancelError && (
                  <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">{cancelError}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-tag text-ink-muted
                               font-semibold hover:bg-bg transition">
                    不取消
                  </button>
                  <button onClick={handleCancel} disabled={cancelling}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold
                               hover:bg-red-600 transition disabled:opacity-60">
                    {cancelling ? '取消中...' : '確認取消'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back to teacher page */}
        <div className="text-center">
          <button onClick={() => router.push(`/${booking.teacherSlug}`)}
            className="text-primary font-semibold hover:underline text-sm">
            返回老師預約頁，再次預約
          </button>
        </div>

      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={16}
        className="text-ink-muted mt-0.5 shrink-0" />
      <span className="text-sm text-ink-muted w-20 shrink-0">{label}</span>
      <span className="text-sm text-ink font-medium flex-1 break-all">{value}</span>
    </div>
  )
}
