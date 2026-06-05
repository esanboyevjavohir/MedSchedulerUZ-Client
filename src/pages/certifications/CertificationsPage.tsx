import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { certificationService, userService } from '../../services'
import type { CertificationResponseModel, UserResponseModel, AddCertificationModel } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  cert:    'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  plus:    'M12 4v16m8-8H4',
  close:   'M6 18L18 6M6 6l12 12',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  warn:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  check:   'M5 13l4 4L19 7',
  file:    'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  upload:  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

const daysLeft = (d?: string) => {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddCertModal({ open, onClose, onSuccess, defaultUserId, isAdmin, users }: {
  open: boolean; onClose: () => void; onSuccess: () => void
  defaultUserId: string; isAdmin: boolean; users: UserResponseModel[]
}) {
  const [userId,     setUserId]     = useState(defaultUserId)
  const [name,       setName]       = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [docBase64,  setDocBase64]  = useState<string | undefined>()
  const [docName,    setDocName]    = useState<string | undefined>()
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUserId(defaultUserId); setName(''); setIssuedDate('')
      setExpiryDate(''); setDocBase64(undefined); setDocName(undefined)
      setError(''); setSuccess(false)
    }
  }, [open, defaultUserId])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('Fayl hajmi 5MB dan oshmasin'); return }
    setDocName(f.name)
    const reader = new FileReader()
    reader.onload = ev => setDocBase64((ev.target?.result as string)?.split(',')[1])
    reader.readAsDataURL(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Sertifikat nomi kiriting'); return }
    if (!issuedDate)  { setError('Berilgan sanani kiriting'); return }
    setLoading(true); setError('')
    try {
      const model: AddCertificationModel = {
        userId, name: name.trim(), issuedDate,
        expiryDate: expiryDate || undefined,
        documentBase64: docBase64, documentFileName: docName,
      }
      const res = await certificationService.add(model)
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi'); return }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icon d={IC.cert} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Sertifikat qo'shish</h2>
              <p className="text-slate-500 text-xs">Yangi sertifikat yoki litsenziya</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Sertifikat qo'shildi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Xodim</label>
                  <select value={userId} onChange={e => setUserId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all">
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Sertifikat nomi</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Masalan: Tibbiyot litsenziyasi, CPR sertifikati..."
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Berilgan sana</label>
                  <input type="date" value={issuedDate} onChange={e => setIssuedDate(e.target.value)} required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tugash sanasi <span className="text-slate-600">(ixt.)</span></label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Hujjat <span className="text-slate-600">(ixt., max 5MB)</span></label>
                <input ref={fileRef} type="file" onChange={handleFile} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl px-4 py-4 text-sm transition-all flex flex-col items-center gap-2 ${
                    docName ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:border-slate-600 text-slate-500'}`}>
                  <Icon d={docName ? IC.file : IC.upload} className="w-5 h-5" />
                  <span>{docName ?? 'PDF, JPG yoki PNG yuklang'}</span>
                </button>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium">Bekor qilish</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saqlanmoqda...</span></> : 'Saqlash'}
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
function DeleteModal({ cert, onClose, onSuccess }: {
  cert: CertificationResponseModel | null; onClose: () => void; onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  if (!cert) return null
  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await certificationService.delete(cert.id)
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik'); return }
      onSuccess(); onClose()
    } catch { setError('Serverga ulanishda xatolik') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="px-5 py-6 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon d={IC.trash} className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold text-base">Sertifikatni o'chirish</p>
            <p className="text-slate-400 text-sm mt-1"><span className="text-white font-medium">"{cert.name}"</span> ni o'chirasizmi?</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-sm font-medium">Bekor qilish</button>
            <button onClick={handleDelete} disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "O'chirish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Cert Card ─────────────────────────────────────────────────────────────────
function CertCard({ cert, canDelete, onDelete }: {
  cert: CertificationResponseModel; canDelete: boolean; onDelete: (c: CertificationResponseModel) => void
}) {
  const days = daysLeft(cert.expiryDate)
  const badge = cert.isExpired
    ? { label: "Muddati o'tgan",   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'         }
    : cert.isExpiringSoon
    ? { label: `${days} kun qoldi`, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'     }
    : days !== null
    ? { label: `${days} kun qoldi`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
    : { label: 'Muddatsiz',         color: 'text-slate-400',   bg: 'bg-slate-700/50 border-slate-600/50'     }

  const cardBorder = cert.isExpired
    ? 'border-red-500/30 hover:border-red-500/50'
    : cert.isExpiringSoon
    ? 'border-amber-500/30 hover:border-amber-500/50'
    : 'border-slate-800 hover:border-slate-700'

  const iconStyle = cert.isExpired ? 'bg-red-500/20 text-red-400' : cert.isExpiringSoon ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'

  return (
    <div className={`bg-slate-900 border ${cardBorder} rounded-2xl p-4 transition-all`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
            <Icon d={IC.cert} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{cert.name}</p>
            <p className="text-slate-500 text-xs">{cert.userFullName}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex-shrink-0 ${badge.bg} ${badge.color}`}>{badge.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800/60 rounded-xl px-3 py-2">
          <p className="text-slate-500 text-[10px] mb-0.5">Berilgan sana</p>
          <p className="text-white text-xs font-medium">{fmtDate(cert.issuedDate)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3 py-2">
          <p className="text-slate-500 text-[10px] mb-0.5">Tugash sanasi</p>
          <p className={`text-xs font-medium ${cert.isExpired ? 'text-red-400' : cert.isExpiringSoon ? 'text-amber-400' : 'text-white'}`}>
            {fmtDate(cert.expiryDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {cert.documentFileName && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Icon d={IC.file} className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{cert.documentFileName}</span>
            </div>
          )}
          {cert.isNotified && (
            <div className="flex items-center gap-1 text-emerald-500 text-xs">
              <Icon d={IC.check} className="w-3.5 h-3.5" />
              <span>Bildirildi</span>
            </div>
          )}
        </div>
        {canDelete && (
          <button onClick={() => onDelete(cert)}
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all">
            <Icon d={IC.trash} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {(cert.isExpired || cert.isExpiringSoon) && (
        <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${cert.isExpired ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
          <Icon d={IC.warn} className={`w-4 h-4 flex-shrink-0 ${cert.isExpired ? 'text-red-400' : 'text-amber-400'}`} />
          <p className={`text-xs ${cert.isExpired ? 'text-red-300' : 'text-amber-300'}`}>
            {cert.isExpired ? "Bu sertifikat muddati tugagan! Yangilanishi kerak." : `Sertifikat ${days} kundan keyin tugaydi.`}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CertificationsPage() {
  const { user } = useAuth()
  const role   = user?.roleType ?? 'Employee'
  const userId = user?.id ?? ''
  const isAdmin = role === 'HospitalAdmin' || role === 'SuperAdmin' || role === 'DeptHead'

  const [certs,      setCerts]      = useState<CertificationResponseModel[]>([])
  const [users,      setUsers]      = useState<UserResponseModel[]>([])
  const [loading,    setLoading]    = useState(true)
  const [addOpen,    setAddOpen]    = useState(false)
  const [deleteCert, setDeleteCert] = useState<CertificationResponseModel | null>(null)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState<'all' | 'active' | 'expiring' | 'expired'>('all')
  const [selUserId,  setSelUserId]  = useState<string>('all')

  const fetchCerts = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const usersRes = await userService.getAll()
        const userList = usersRes.data.succedded ? (usersRes.data.result ?? []) : []
        setUsers(userList)
        const targetUsers = selUserId === 'all' ? userList : userList.filter(u => u.id === selUserId)
        const results = await Promise.allSettled(targetUsers.map(u => certificationService.getByUser(u.id)))
        const all: CertificationResponseModel[] = []
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value.data.succedded) all.push(...(r.value.data.result ?? []))
        })
        setCerts(all.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()))
      } else {
        const res = await certificationService.getByUser(userId)
        if (res.data.succedded) setCerts((res.data.result ?? []).sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()))
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCerts() }, [userId, selUserId])

  const filtered = certs.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.userFullName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : filter === 'expired' ? c.isExpired : filter === 'expiring' ? c.isExpiringSoon && !c.isExpired : !c.isExpired && !c.isExpiringSoon
    return matchSearch && matchFilter
  })

  const totalCount    = certs.length
  const activeCount   = certs.filter(c => !c.isExpired && !c.isExpiringSoon).length
  const expiringCount = certs.filter(c => c.isExpiringSoon && !c.isExpired).length
  const expiredCount  = certs.filter(c => c.isExpired).length

  const FILTERS = [
    { key: 'all',      label: 'Barchasi',       count: totalCount    },
    { key: 'active',   label: 'Amaldagi',        count: activeCount   },
    { key: 'expiring', label: 'Muddat yaqin',    count: expiringCount },
    { key: 'expired',  label: "Muddati o'tgan",  count: expiredCount  },
  ] as const

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Sertifikatlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{isAdmin ? 'Xodimlar sertifikat va litsenziyalari' : 'Sertifikat va litsenziyalaringiz'}</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
          <Icon d={IC.plus} className="w-4 h-4" />
          <span className="hidden sm:inline">Qo'shish</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami',           value: totalCount,    color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20'   },
          { label: 'Amaldagi',       value: activeCount,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Muddat yaqin',   value: expiringCount, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
          { label: "Muddati o'tgan", value: expiredCount,  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            {loading ? <div className="w-10 h-8 bg-slate-700 rounded-lg animate-pulse mb-1" />
              : <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>}
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Icon d={IC.search} className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sertifikat nomi yoki xodim..."
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
        </div>
        {isAdmin && users.length > 0 && (
          <select value={selUserId} onChange={e => setSelUserId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-all">
            <option value="all">Barcha xodimlar</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-slate-700'}`}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Icon d={IC.cert} className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Sertifikatlar yo'q</p>
            <p className="text-slate-500 text-sm mt-1">{search ? `"${search}" bo'yicha topilmadi` : "Hali sertifikat qo'shilmagan"}</p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
            <Icon d={IC.plus} className="w-4 h-4" />
            Sertifikat qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(cert => (
            <CertCard key={cert.id} cert={cert} canDelete={isAdmin} onDelete={setDeleteCert} />
          ))}
        </div>
      )}

      <AddCertModal open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchCerts}
        defaultUserId={userId} isAdmin={isAdmin} users={users} />
      <DeleteModal cert={deleteCert} onClose={() => setDeleteCert(null)} onSuccess={fetchCerts} />
    </div>
  )
}