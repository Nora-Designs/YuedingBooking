'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Icon from '@/components/Icon'

interface PortfolioLink { url: string; label: string }

interface Profile {
  name: string
  bio: string
  price: string
  showPrices: boolean
  avatar: string
  portfolioLinks: PortfolioLink[]
}

interface Service {
  id: string
  name: string
  description: string
  price: string
  showPrice: boolean
  serviceType: string
  sortOrder: number
  isActive: boolean
}

const blankService = (): Partial<Service> => ({
  name: '', description: '', price: '', showPrice: true,
  serviceType: '', sortOrder: 0, isActive: true,
})

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <span onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${on ? 'bg-primary' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </span>
  )
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile,  setProfile]  = useState<Profile>({
    name: '', bio: '', price: '', showPrices: true, avatar: '', portfolioLinks: [],
  })
  const [services,  setServices]  = useState<Service[]>([])
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [tab,       setTab]       = useState<'profile' | 'services'>('profile')
  const [editSvc,   setEditSvc]   = useState<Partial<Service> | null>(null)
  const [svcSaving, setSvcSaving] = useState(false)

  useEffect(() => {
    fetch('/api/profile', { cache: 'no-store' }).then((r) => r.json()).then((data) => {
      setProfile({
        name:           data.name           || '',
        bio:            data.bio            || '',
        price:          data.price          || '',
        showPrices:     data.showPrices     ?? true,
        avatar:         data.avatar         || '',
        portfolioLinks: data.portfolioLinks || [],
      })
    })
    fetch('/api/services', { cache: 'no-store' }).then((r) => r.json()).then(setServices).catch(() => {})
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addPortfolioLink() {
    if (profile.portfolioLinks.length >= 3) return
    setProfile(p => ({ ...p, portfolioLinks: [...p.portfolioLinks, { url: '', label: '' }] }))
  }
  function updatePortfolioLink(idx: number, field: 'url' | 'label', val: string) {
    setProfile(p => ({
      ...p,
      portfolioLinks: p.portfolioLinks.map((l, i) => i === idx ? { ...l, [field]: val } : l),
    }))
  }
  function removePortfolioLink(idx: number) {
    setProfile(p => ({ ...p, portfolioLinks: p.portfolioLinks.filter((_, i) => i !== idx) }))
  }

  async function saveService() {
    if (!editSvc?.name) return
    setSvcSaving(true)
    const isNew = !editSvc.id
    const url   = isNew ? '/api/services' : `/api/services/${editSvc.id}`
    const res   = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editSvc),
    })
    const data = await res.json()
    setSvcSaving(false)
    if (res.ok) {
      setServices((prev) => isNew ? [...prev, data] : prev.map((s) => s.id === data.id ? data : s))
      setEditSvc(null)
    }
  }
  async function deleteService(id: string) {
    if (!confirm('確定要刪除此服務？')) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    setServices((prev) => prev.filter((s) => s.id !== id))
  }
  async function toggleServiceActive(s: Service) {
    const res = await fetch(`/api/services/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setServices((prev) => prev.map((x) => x.id === s.id ? updated : x))
    }
  }

  const existingTypes = Array.from(new Set(services.map(s => s.serviceType).filter(Boolean)))
  const inp = 'input-base'
  const lbl = 'label-base'

  return (
    <div className="p-6 sm:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">個人設定</h1>
        <p className="text-ink-muted mt-1">管理你的公開頁面資訊與服務項目</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-7 border-b border-tag">
        {(['profile', 'services'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 px-1 text-base font-semibold border-b-2 transition -mb-px ${
              tab === t ? 'border-primary text-accent' : 'border-transparent text-ink-muted hover:text-ink'
            }`}>
            {t === 'profile' ? '基本資料' : '服務項目'}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="w-full space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Personal info */}
            <div className="bg-white border border-tag rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-ink text-base border-b border-tag pb-3">個人資料</h2>

              {/* Avatar */}
              <div>
                <label className={lbl}>個人照片（圖片連結）</label>
                <div className="flex items-center gap-4">
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt="avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-tag shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-tag flex items-center justify-center shrink-0">
                      <Icon name="users" size={28} className="text-ink-muted" />
                    </div>
                  )}
                  <input type="url" value={profile.avatar}
                    onChange={(e) => setProfile(p => ({ ...p, avatar: e.target.value }))}
                    className={inp} placeholder="https://... (圖片連結)" />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={lbl}>名稱 <span className="text-red-400">*</span></label>
                <input type="text" value={profile.name}
                  onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                  required className={inp} />
              </div>

              {/* Bio */}
              <div>
                <label className={lbl}>自我介紹</label>
                <textarea value={profile.bio}
                  onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                  rows={4} className={inp + ' resize-none'}
                  placeholder="介紹你的服務風格、資歷..." />
              </div>
            </div>

            {/* Right: Price */}
            <div className="bg-white border border-tag rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-ink text-base border-b border-tag pb-3">價格設定</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={lbl + ' mb-0'}>是否公開價格</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-muted">{profile.showPrices ? '公開' : '不公開'}</span>
                    <Toggle on={profile.showPrices}
                      onToggle={() => setProfile(p => ({ ...p, showPrices: !p.showPrices }))} />
                  </div>
                </div>
                {profile.showPrices ? (
                  <input type="text" value={profile.price}
                    onChange={(e) => setProfile(p => ({ ...p, price: e.target.value }))}
                    className={inp} placeholder="例：嫁接睫毛 $1,500 起 ／ 新娘造型 $6,000 起" />
                ) : (
                  <div className="px-4 py-3 bg-bg border border-tag rounded-xl text-ink-muted text-sm">
                    客人頁面將顯示「歡迎詢問」
                  </div>
                )}
              </div>
              <p className="text-xs text-ink-muted pt-3 border-t border-tag">
                你的預約連結：<span className="text-primary font-medium">/{session?.user.slug}</span>
              </p>
            </div>
          </div>

          {/* Portfolio links */}
          <div className="bg-white border border-tag rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-ink text-base">作品 / 社群連結</h2>
                <p className="text-sm text-ink-muted mt-0.5">最多 3 個，顯示在你的預約頁</p>
              </div>
              <button type="button" onClick={addPortfolioLink}
                disabled={profile.portfolioLinks.length >= 3}
                className="flex items-center gap-2 px-4 py-2 bg-tag text-accent rounded-xl
                           text-sm font-semibold hover:bg-primary/10 transition disabled:opacity-40">
                <Icon name="plus" size={15} /> 新增連結
              </button>
            </div>
            {profile.portfolioLinks.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-muted border border-dashed border-tag rounded-xl">
                尚未新增任何連結
              </div>
            ) : (
              <div className="space-y-3">
                {profile.portfolioLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <input type="text" value={link.label}
                      onChange={(e) => updatePortfolioLink(idx, 'label', e.target.value)}
                      placeholder="名稱，例：Instagram"
                      className="border border-tag rounded-xl px-3 py-2.5 text-base bg-bg text-ink
                                 focus:outline-none focus:ring-2 focus:ring-primary/40 w-40 shrink-0" />
                    <input type="url" value={link.url}
                      onChange={(e) => updatePortfolioLink(idx, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 border border-tag rounded-xl px-3 py-2.5 text-base bg-bg text-ink
                                 focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    <button type="button" onClick={() => removePortfolioLink(idx)}
                      className="text-ink-muted hover:text-red-500 transition p-1.5 shrink-0">
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pb-4">
            <button type="submit" disabled={saving}
              className="px-8 py-3 bg-primary text-white rounded-xl font-semibold
                         hover:bg-accent transition disabled:opacity-60">
              {saving ? '儲存中...' : '儲存變更'}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">✓ 已儲存</span>}
          </div>
        </form>
      )}

      {/* ── Services tab ── */}
      {tab === 'services' && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-5">
            <p className="text-ink-muted text-sm">設定服務項目，客人預約時可選擇。服務類型可自由輸入。</p>
            <button onClick={() => setEditSvc(blankService())}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white
                         rounded-xl font-semibold text-sm hover:bg-accent transition">
              <Icon name="plus" size={16} /> 新增服務
            </button>
          </div>

          {services.length === 0 ? (
            <div className="bg-white border border-dashed border-tag rounded-2xl py-16
                            text-center text-ink-muted">
              <Icon name="plus" size={32} className="mx-auto mb-3 text-tag" />
              <p>尚未新增任何服務項目</p>
              <button onClick={() => setEditSvc(blankService())}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-accent transition">
                新增第一個服務
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-tag overflow-hidden">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_140px_90px_70px] gap-4 px-5 py-3
                              bg-bg border-b border-tag text-xs font-semibold text-ink-muted uppercase tracking-wide">
                <span>服務名稱</span>
                <span className="text-right">價格</span>
                <span className="text-center">狀態</span>
                <span />
              </div>

              {(() => {
                const sorted = [...services].sort((a, b) =>
                  (a.serviceType || '').localeCompare(b.serviceType || '') || a.name.localeCompare(b.name)
                )
                let lastType = ''
                return sorted.map((s) => {
                  const showDivider = s.serviceType !== lastType
                  lastType = s.serviceType
                  return (
                    <div key={s.id}>
                      {showDivider && (
                        <div className="px-5 py-2 bg-tag/40 border-b border-tag">
                          <span className="text-xs font-bold text-accent uppercase tracking-wider">
                            {s.serviceType || '未分類'}
                          </span>
                        </div>
                      )}
                      <div className={`flex sm:grid sm:grid-cols-[1fr_140px_90px_70px] gap-3 sm:gap-4
                                       px-5 py-4 border-b border-tag last:border-0 items-center
                                       ${!s.isActive ? 'opacity-50' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink">{s.name}</p>
                          {s.description && (
                            <p className="text-sm text-ink-muted mt-0.5 line-clamp-1">{s.description}</p>
                          )}
                        </div>
                        <div className="sm:text-right shrink-0">
                          {s.showPrice && s.price
                            ? <span className="text-sm text-primary font-semibold">{s.price}</span>
                            : <span className="text-xs text-ink-muted">歡迎詢問</span>
                          }
                        </div>
                        <div className="sm:text-center shrink-0">
                          <button onClick={() => toggleServiceActive(s)}
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                              s.isActive
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}>
                            {s.isActive ? '啟用' : '停用'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditSvc({ ...s })}
                            className="text-ink-muted hover:text-primary transition p-1.5 rounded-lg hover:bg-bg">
                            <Icon name="edit" size={15} />
                          </button>
                          <button onClick={() => deleteService(s.id)}
                            className="text-ink-muted hover:text-red-500 transition p-1.5 rounded-lg hover:bg-bg">
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Service edit modal ── */}
      {editSvc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-tag">
              <h3 className="font-bold text-ink text-lg">{editSvc.id ? '編輯服務' : '新增服務'}</h3>
              <button onClick={() => setEditSvc(null)} className="text-ink-muted hover:text-ink">
                <Icon name="x" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Service type — free-form */}
              <div>
                <label className={lbl}>服務類型</label>
                <input type="text" list="svc-types-modal"
                  value={editSvc.serviceType ?? ''}
                  onChange={(e) => setEditSvc(p => ({ ...p, serviceType: e.target.value }))}
                  className={inp}
                  placeholder="例：新娘服務、一對一課程、彩妝課程..." />
                <datalist id="svc-types-modal">
                  {existingTypes.map(t => <option key={t} value={t} />)}
                </datalist>
                <p className="text-xs text-ink-muted mt-1">自由輸入，或從下拉選擇已有類型</p>
              </div>

              <div>
                <label className={lbl}>服務名稱 <span className="text-red-400">*</span></label>
                <input type="text" value={editSvc.name ?? ''}
                  onChange={(e) => setEditSvc(p => ({ ...p, name: e.target.value }))}
                  className={inp} placeholder="例：美式嫁接睫毛" />
              </div>

              <div>
                <label className={lbl}>說明</label>
                <textarea value={editSvc.description ?? ''}
                  onChange={(e) => setEditSvc(p => ({ ...p, description: e.target.value }))}
                  className={inp + ' resize-none'} rows={2}
                  placeholder="服務內容說明..." />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={lbl + ' mb-0'}>價格</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-muted">{editSvc.showPrice ? '公開' : '不公開'}</span>
                    <Toggle on={!!editSvc.showPrice}
                      onToggle={() => setEditSvc(p => ({ ...p, showPrice: !p?.showPrice }))} />
                  </div>
                </div>
                {editSvc.showPrice ? (
                  <input type="text" value={editSvc.price ?? ''}
                    onChange={(e) => setEditSvc(p => ({ ...p, price: e.target.value }))}
                    className={inp} placeholder="例：$1,500 ／ $3,000 起" />
                ) : (
                  <div className="px-4 py-3 bg-bg border border-tag rounded-xl text-sm text-ink-muted">
                    客人將看到「歡迎詢問」
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={saveService} disabled={svcSaving || !editSvc.name}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold
                           hover:bg-accent transition disabled:opacity-60">
                {svcSaving ? '儲存中...' : '儲存'}
              </button>
              <button onClick={() => setEditSvc(null)}
                className="px-5 py-3 bg-bg border border-tag rounded-xl text-ink-muted font-semibold hover:bg-tag transition">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
