import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { leaveRequestService } from '../../services'
import type { LeaveRequestResponseModel } from '../../types'
import { LeaveStatus, LeaveType } from '../../types'

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  plus:    'M12 4v16m8-8H4',
  leave:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  close:   'M6 18L18 6M6 6l12 12',
  check:   'M5 13l4 4L19 7',
  x:       'M6 18L18 6M6 6l12 12',
  clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  [LeaveStatus.Pending]:  { label: 'Kutilmoqda',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'    },
  [LeaveStatus.Approved]: { label: 'Tasdiqlandi', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30'},
  [LeaveStatus.Rejected]: { label: 'Rad etildi',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'        },
}

const TYPE_CONFIG = {
  [LeaveType.Annual]:   { label: 'Yillik ta\'til',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30'    },
  [LeaveType.Sick]:     { label: 'Kasallik',        color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'      },
  [LeaveType.Unpaid]:   { label: 'Haqsiz ta\'til',  color: 'text-slate-400',  bg: 'bg-slate-700 border-slate-600'        },
  [LeaveType.Maternity]:{ label: 'Tug\'ruq ta\'tili',color: 'text-violet-400',bg: 'bg-violet-500/10 border-violet-500/30'},
}

function fmtDate(d: string) {
  const date = new Date(d)
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  return `${date.getDate()}-${months[date.getMonth()]}, ${date.getFullYear()}`
}

function daysBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-cyan-400 to-blue-600','from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600','from-amber-400 to-orange-600',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ── Add Modal (Employee uchun) ────────────────────────────────────────────────
function AddModal({ open, onClose, onSuccess }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    startDate: '',
    endDate:   '',
    leaveType: LeaveType.Annual,
    reason:    '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ startDate: '', endDate: '', leaveType: LeaveType.Annual, reason: '' })
    setError(''); setSuccess(false)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate) { setError('Boshlanish sanasini kiriting'); return }
    if (!form.endDate)   { setError('Tugash sanasini kiriting'); return }
    if (new Date(form.endDate) < new Date(form.startDate)) { setError('Tugash sanasi boshlanish sanasidan oldin bo\'lmasligi kerak'); return }
    if (!form.reason.trim()) { setError('Sabab kiriting'); return }

    setLoading(true); setError('')
    try {
      const res = await leaveRequestService.create(form)
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi'); return }
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Ta'til so'rovi</h2>
            <p className="text-slate-500 text-xs mt-0.5">Yangi ta'til so'rovi yuboring</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">So'rov yuborildi!</p>
              <p className="text-slate-400 text-sm text-center">Administrator ko'rib chiqadi</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Ta'til turi */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Ta'til turi *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[LeaveType.Annual, LeaveType.Sick, LeaveType.Unpaid, LeaveType.Maternity].map(t => {
                    const tc = TYPE_CONFIG[t]
                    const selected = form.leaveType === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, leaveType: t }))}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
                          selected ? `${tc.bg} ${tc.color}` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {tc.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sanalar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Boshlanish *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tugash *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Kun hisobi */}
              {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Icon d={IC.clock} className="w-4 h-4 text-cyan-400" />
                  <p className="text-cyan-300 text-sm">
                    Jami <span className="font-bold">{daysBetween(form.startDate, form.endDate)}</span> kun
                  </p>
                </div>
              )}

              {/* Sabab */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Sabab *</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Ta'til sababini kiriting..."
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Yuborilmoqda...</span></>
                  : 'So\'rov yuborish'
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Respond Modal (Admin uchun) ───────────────────────────────────────────────
function RespondModal({ leave, onClose, onConfirm, loading }: {
  leave: LeaveRequestResponseModel | null
  onClose: () => void
  onConfirm: (status: LeaveStatus) => void
  loading: boolean
}) {
  if (!leave) return null
  const tc = TYPE_CONFIG[leave.leaveType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-4">Ta'til so'rovi</h3>

        {/* Info */}
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-2 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatarColor(leave.userFullName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {getInitials(leave.userFullName)}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{leave.userFullName}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${tc.bg} ${tc.color}`}>{tc.label}</span>
            </div>
          </div>
          <div className="text-slate-400 text-sm pt-1">
            <p>{fmtDate(leave.startDate)} — {fmtDate(leave.endDate)}</p>
            <p className="text-xs mt-0.5 text-slate-500">{daysBetween(leave.startDate, leave.endDate)} kun · {leave.reason}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(LeaveStatus.Rejected)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50"
          >
            <Icon d={IC.x} className="w-4 h-4" />
            Rad etish
          </button>
          <button
            onClick={() => onConfirm(LeaveStatus.Approved)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all text-sm font-medium disabled:opacity-50"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              : <Icon d={IC.check} className="w-4 h-4" />
            }
            Tasdiqlash
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-sm">
          Bekor qilish
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeavesPage() {
  const { user: currentUser } = useAuth()
  const currentRole = currentUser?.roleType ?? 'Employee'

  const [leaves,       setLeaves]       = useState<LeaveRequestResponseModel[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAdd,      setShowAdd]      = useState(false)
  const [respondItem,  setRespondItem]  = useState<LeaveRequestResponseModel | null>(null)
  const [respLoading,  setRespLoading]  = useState(false)

  const isEmployee  = currentRole === 'Employee'
  const canRespond  = ['SuperAdmin', 'HospitalAdmin', 'DeptHead'].includes(currentRole)

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      let res
      if (isEmployee) {
        res = await leaveRequestService.getByUser(currentUser?.id ?? '')
      } else {
        res = await leaveRequestService.getAll() // ← getPending() o'rniga getAll()
      }
      if (res?.data.succedded) setLeaves(res.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeaves() }, [])

  const handleRespond = async (status: LeaveStatus) => {
    if (!respondItem) return
    setRespLoading(true)
    try {
      await leaveRequestService.respond(respondItem.id, { status })
      setRespondItem(null)
      fetchLeaves()
    } finally {
      setRespLoading(false)
    }
  }

  const filtered = leaves.filter(l => {
    const matchSearch = l.userFullName?.toLowerCase().includes(search.toLowerCase()) ||
                        l.reason?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || l.status === Number(statusFilter)
    return matchSearch && matchStatus
  })

  const pendingCount  = leaves.filter(l => l.status === LeaveStatus.Pending).length
  const approvedCount = leaves.filter(l => l.status === LeaveStatus.Approved).length
  const rejectedCount = leaves.filter(l => l.status === LeaveStatus.Rejected).length

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Ta'til so'rovlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Jami {leaves.length} ta so'rov</p>
        </div>
        {isEmployee && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm"
          >
            <Icon d={IC.plus} className="w-4 h-4" />
            So'rov yuborish
          </button>
        )}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Kutilmoqda',  value: pendingCount,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'    },
          { label: 'Tasdiqlandi', value: approvedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'},
          { label: 'Rad etildi',  value: rejectedCount, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'        },
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
            placeholder="Xodim yoki sabab bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[160px]"
        >
          <option value="all">Barcha holatlar</option>
          <option value={LeaveStatus.Pending}>Kutilmoqda</option>
          <option value={LeaveStatus.Approved}>Tasdiqlandi</option>
          <option value={LeaveStatus.Rejected}>Rad etildi</option>
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
              <Icon d={IC.leave} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Ta'til so'rovlari topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {!isEmployee && <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Xodim</th>}
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Tur</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Muddat</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Sabab</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    {canRespond && <th className="px-5 py-3.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(l => {
                    const sc = STATUS_CONFIG[l.status]
                    const tc = TYPE_CONFIG[l.leaveType]
                    return (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        {!isEmployee && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor(l.userFullName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {getInitials(l.userFullName)}
                              </div>
                              <p className="text-white text-sm font-medium">{l.userFullName}</p>
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tc.bg} ${tc.color}`}>
                            {tc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-white text-sm">{fmtDate(l.startDate)}</p>
                          <p className="text-slate-500 text-xs">— {fmtDate(l.endDate)} · {daysBetween(l.startDate, l.endDate)} kun</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-400 text-sm truncate max-w-[200px]">{l.reason}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        {canRespond && (
                          <td className="px-5 py-3.5">
                            {l.status === LeaveStatus.Pending && (
                              <button
                                onClick={() => setRespondItem(l)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 transition-all font-medium"
                              >
                                Ko'rib chiqish
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map(l => {
                const sc = STATUS_CONFIG[l.status]
                const tc = TYPE_CONFIG[l.leaveType]
                return (
                  <div key={l.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {!isEmployee && (
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor(l.userFullName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(l.userFullName)}
                          </div>
                        )}
                        <div>
                          {!isEmployee && <p className="text-white text-sm font-medium">{l.userFullName}</p>}
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${tc.bg} ${tc.color}`}>{tc.label}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{fmtDate(l.startDate)} — {fmtDate(l.endDate)} · {daysBetween(l.startDate, l.endDate)} kun</p>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{l.reason}</p>
                    {canRespond && l.status === LeaveStatus.Pending && (
                      <button
                        onClick={() => setRespondItem(l)}
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-cyan-500/30 transition-all font-medium"
                      >
                        Ko'rib chiqish
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchLeaves} />
      <RespondModal leave={respondItem} onClose={() => setRespondItem(null)} onConfirm={handleRespond} loading={respLoading} />
    </div>
  )
}