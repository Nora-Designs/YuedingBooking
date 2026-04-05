'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LogoText } from '@/components/Logo'

export default function CancelPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [state, setState] = useState<'confirm' | 'done' | 'error'>('confirm')
  const [msg,   setMsg]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    setLoading(true)
    const res = await fetch(`/api/public/bookings/${id}/cancel`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setState('error')
      setMsg(data.error || '取消失敗，請稍後再試')
    } else {
      setState('done')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <LogoText size="sm" href="/" />
        </div>
<div className="bg-white rounded-2xl border border-tag shadow-sm p-7 text-center">
          {state === 'confirm' && (
            <>
              <div className="text-4xl mb-4">🗓️</div>
              <h1 className="text-xl font-bold text-ink mb-2">取消預約</h1>
              <p className="text-ink-muted mb-6">
                確定要取消此預約嗎？取消後無法復原，如需重新預約請再次填寫。
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleCancel} disabled={loading}
                  className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold
                             text-base hover:bg-red-600 transition disabled:opacity-60">
                  {loading ? '取消中...' : '確認取消預約'}
                </button>
                <button onClick={() => router.back()}
                  className="w-full bg-bg border border-tag text-ink-muted py-3 rounded-xl
                             font-semibold text-base hover:bg-tag transition">
                  不取消，返回
                </button>
              </div>
            </>
          )}

          {state === 'done' && (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-ink mb-2">已取消預約</h1>
              <p className="text-ink-muted mb-6">你的預約已成功取消。如需重新預約，請回到老師頁面。</p>
              <button onClick={() => router.push('/')}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold
                           hover:bg-accent transition">
                回首頁
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-ink mb-2">取消失敗</h1>
              <p className="text-ink-muted mb-6">{msg}</p>
              <button onClick={() => router.push('/')}
                className="w-full bg-bg border border-tag text-ink-muted py-3
                           rounded-xl font-semibold hover:bg-tag transition">
                回首頁
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
