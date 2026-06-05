import { useEffect, useState } from 'react'
import { hospitalService } from '../../services'
import type { HospitalResponseModel } from '../../types'
import { HospitalType } from '../../types'

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  plus:     'M12 4v16m8-8H4',
  search:   'M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z',
  hospital: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  close:    'M6 18L18 6M6 6l12 12',
  trash:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  phone:    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  edit:     'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  check:    'M5 13l4 4L19 7',
}

const TYPE_CONFIG = {
  [HospitalType.Central]: { label: 'Markaziy',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30'   },
  [HospitalType.Branch]:  { label: 'Filial',     color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30'},
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
interface AddModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function AddModal({ open, onClose, onSuccess }: AddModalProps) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', type: HospitalType.Central })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ name: '', address: '', phone: '', type: HospitalType.Central })
    setError('')
    setSuccess(false)
  }, [open])

  const validate = () => {
    if (!form.name.trim())    { setError('Shifoxona nomini kiriting'); return false }
    if (!form.address.trim()) { setError('Manzilni kiriting'); return false }
    if (!form.phone.trim())   { setError('Telefon raqamini kiriting'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')
    try {
      const res = await hospitalService.create(form)
      if (!res.data.succedded) {
        setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi')
        return
      }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Yangi shifoxona</h2>
            <p className="text-slate-500 text-xs mt-0.5">Ma'lumotlarni to'ldiring</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Shifoxona qo'shildi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Shifoxona nomi *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Toshkent Shahri 1-son Klinik Kasalxonasi"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Manzil *</label>
                <input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Toshkent, Yunusobod tumani"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefon raqami *</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+998712345678"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Turi *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[HospitalType.Central, HospitalType.Branch].map(t => {
                    const tc = TYPE_CONFIG[t]
                    const selected = form.type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                          ${selected
                            ? `${tc.bg} ${tc.color} border-current`
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                      >
                        {tc.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                             disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all
                             flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Qo'shilmoqda...</span></>
                    : "Shifoxona qo'shish"
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ hospital, onClose, onConfirm, loading }: {
  hospital: HospitalResponseModel | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!hospital) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon d={IC.trash} className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-white font-bold text-center text-lg mb-1">Shifoxonani o'chirish</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          <span className="text-white font-medium">{hospital.name}</span> ni o'chirishni tasdiqlaysizmi?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium">
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HospitalsPage() {
  const [hospitals,   setHospitals]   = useState<HospitalResponseModel[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState<string>('all')
  const [showAdd,     setShowAdd]     = useState(false)
  const [deleteItem,  setDeleteItem]  = useState<HospitalResponseModel | null>(null)
  const [delLoading,  setDelLoading]  = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await hospitalService.getAll()
      if (res.data.succedded) setHospitals(res.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async () => {
    if (!deleteItem) return
    setDelLoading(true)
    try {
      await hospitalService.delete(deleteItem.id)
      setDeleteItem(null)
      fetch()
    } finally {
      setDelLoading(false)
    }
  }

  const filtered = hospitals.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                        h.address.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || h.type === Number(typeFilter)
    return matchSearch && matchType
  })

  const activeCount  = hospitals.filter(h => h.isActive).length
  const centralCount = hospitals.filter(h => h.type === HospitalType.Central).length
  const branchCount  = hospitals.filter(h => h.type === HospitalType.Branch).length

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Shifoxonalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Jami {hospitals.length} ta shifoxona</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600
                     hover:from-cyan-400 hover:to-blue-500 text-white font-semibold
                     rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm"
        >
          <Icon d={IC.plus} className="w-4 h-4" />
          Yangi shifoxona
        </button>
      </div>

      {/* Stats mini */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Faol',      value: activeCount,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Markaziy',  value: centralCount, color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20'       },
          { label: 'Filial',    value: branchCount,  color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl px-4 py-3 flex items-center justify-between`}>
            <p className="text-slate-400 text-xs">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-cyan-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="11" cy="11" r="7" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                </svg>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom yoki manzil bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600
                       rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500
                       focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm
                     focus:outline-none focus:border-cyan-500 transition-all min-w-[150px]"
        >
          <option value="all">Barcha turlar</option>
          <option value={HospitalType.Central}>Markaziy</option>
          <option value={HospitalType.Branch}>Filial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Icon d={IC.hospital} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Shifoxonalar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Shifoxona</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Manzil</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Telefon</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Turi</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(h => {
                    const tc = TYPE_CONFIG[h.type] ?? { label: h.type, color: 'text-slate-400', bg: 'bg-slate-700' }
                    return (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                              <Icon d={IC.hospital} className="w-4 h-4" />
                            </div>
                            <p className="text-white text-sm font-medium">{h.name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                            <Icon d={IC.location} className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{h.address}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                            <Icon d={IC.phone} className="w-3.5 h-3.5 flex-shrink-0" />
                            {h.phone}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tc.bg} ${tc.color}`}>
                            {tc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${h.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                            {h.isActive ? 'Faol' : 'Nofaol'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setDeleteItem(h)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all"
                          >
                            <Icon d={IC.trash} className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map(h => {
                const tc = TYPE_CONFIG[h.type] ?? { label: String(h.type), color: 'text-slate-400', bg: 'bg-slate-700' }
                return (
                  <div key={h.id} className="px-4 py-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <Icon d={IC.hospital} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium truncate">{h.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${tc.bg} ${tc.color}`}>
                          {tc.label}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{h.address}</p>
                      <p className="text-slate-500 text-xs">{h.phone}</p>
                    </div>
                    <button
                      onClick={() => setDeleteItem(h)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <Icon d={IC.trash} className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetch} />
      <DeleteModal hospital={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={delLoading} />
    </div>
  )
}