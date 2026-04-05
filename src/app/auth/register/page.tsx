'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoText } from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', slug: '' })
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'name' && !slugEdited) {
        next.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      if (name === 'slug') setSlugEdited(true)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '註冊失敗'); return }
    router.push('/auth/login?registered=1')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <LogoText size="sm" href="/" />
          <p className="text-ink-muted mt-3">建立你的預約頁面</p>
        </div>

        <div className="bg-white rounded-2xl border border-tag shadow-sm p-7">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="label-base">名稱 / 品牌名稱</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                required className="input-base" placeholder="Eva 美睫工作室" />
            </div>

            {/* Slug — 個人/品牌連結 */}
            <div>
              <label className="label-base">個人 / 品牌連結</label>
              {/* Flush prefix — no gap */}
              <div className="flex border border-tag rounded-xl overflow-hidden
                              focus-within:ring-2 focus-within:ring-primary/40
                              focus-within:border-primary transition bg-bg">
                <span className="flex items-center px-3 bg-tag text-ink-muted text-base
                                  border-r border-tag whitespace-nowrap leading-none">
                  iyueding.app/
                </span>
                <input type="text" name="slug" value={form.slug} onChange={handleChange}
                  required
                  className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-base text-ink"
                  placeholder="eva-lash" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label-base">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                required className="input-base" placeholder="you@example.com" />
            </div>

            {/* Password */}
            <div>
              <label className="label-base">密碼</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                required minLength={6} className="input-base" placeholder="至少 6 個字元" />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-base
                         hover:bg-accent transition disabled:opacity-60 mt-2">
              {loading ? '建立中...' : '建立帳號'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-muted text-sm mt-5">
          已有帳號？{' '}
          <Link href="/auth/login" className="text-accent font-semibold hover:underline">
            登入
          </Link>
        </p>
      </div>
    </div>
  )
}
