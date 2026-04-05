'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoText } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError('Email 或密碼錯誤')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <LogoText size="sm" href="/" />
          <p className="text-ink-muted text-sm mt-3">登入你的帳號</p>
        </div>

        <div className="bg-white rounded-2xl border border-tag shadow-sm p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-light mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-tag rounded-xl px-4 py-3 text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-light mb-1.5 uppercase tracking-wide">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-tag rounded-xl px-4 py-3 text-ink bg-bg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-sm"
                placeholder="••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-accent transition disabled:opacity-60 mt-2"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-muted text-xs mt-5">
          還沒有帳號？{' '}
          <Link href="/auth/register" className="text-accent font-semibold hover:underline">
            免費建立頁面
          </Link>
        </p>
      </div>
    </div>
  )
}
