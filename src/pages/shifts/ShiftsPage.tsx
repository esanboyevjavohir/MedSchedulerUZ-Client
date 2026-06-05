import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AutoGenerateModal } from './AutoGenerateModal'
import {
  shiftService,
  scheduleService,
  userService,
} from '../../services'
import type {
  ShiftResponseModel,
  ScheduleResponseModel,
  UserResponseModel,
} from '../../types'
import { ShiftType, ShiftStatus } from '../../types'
import QRCode from 'qrcode'

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
  shifts:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  close:    'M6 18L18 6M6 6l12 12',
  trash:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  check:    'M5 13l4 4L19 7',
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  qr:       'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
}

// ── Config ────────────────────────────────────────────────────────────────────
const SHIFT_TYPE_CONFIG = {
  [ShiftType.Day]:    { label: 'Kunduzgi',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'   },
  [ShiftType.Night]:  { label: 'Tungi',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'    },
  [ShiftType.OnCall]: { label: 'Navbatchi',  color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30'},
}

const SHIFT_STATUS_CONFIG = {
  [ShiftStatus.Scheduled]:  { label: 'Rejalashtirilgan', color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/30'      },
  [ShiftStatus.Completed]:  { label: 'Bajarilgan',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30'},
  [ShiftStatus.Missed]:     { label: "O'tkazib yuborildi", color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30'        },
  [ShiftStatus.Swapped]:    { label: 'Almashtirildi',    color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30'  },
  [ShiftStatus.Cancelled]:  { label: 'Bekor qilindi',    color: 'text-slate-400',   bg: 'bg-slate-700 border-slate-600'          },
}

function fmtDate(d: string) {
  const date = new Date(d)
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  return `${date.getDate()}-${months[date.getMonth()]}, ${date.getFullYear()}`
}

function fmtTime(t: string) { return t.substring(0, 5) }

function getInitials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-cyan-400 to-blue-600', 'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600', 'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600', 'from-blue-400 to-indigo-600',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QrModal({ shift, onClose }: {
  shift: ShiftResponseModel | null
  onClose: () => void
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!shift) return
    setQrDataUrl(''); setError('')
    setLoading(true)

    const generate = async () => {
      try {
        // qrToken mavjud bo'lsa — to'g'ridan API dan olish
        const res = await shiftService.getQrToken(shift.id)
        if (!res.data.succedded || !res.data.result) {
          setError("QR token topilmadi")
          return
        }
        const token = res.data.result
        // Token dan QR rasm generatsiya
        const clockInUrl = `${window.location.origin}/clock-in?shiftId=${shift.id}&token=${token}`
        const url = await QRCode.toDataURL(clockInUrl, {
          width: 280,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        setQrDataUrl(url)
      } catch {
        setError("QR kod yaratishda xatolik")
      } finally {
        setLoading(false)
      }
    }

    generate()
  }, [shift?.id])

  if (!shift) return null

  const tc = SHIFT_TYPE_CONFIG[shift.shiftType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-base">QR Kod — Davomat</h2>
            <p className="text-slate-500 text-xs mt-0.5">{shift.userFullName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {/* Smena info */}
          <div className="w-full bg-slate-800/60 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{fmtDate(shift.shiftDate)}</p>
              <p className="text-slate-400 text-xs">{fmtTime(shift.startTime)} — {fmtTime(shift.endTime)}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tc.bg} ${tc.color}`}>
              {tc.label}
            </span>
          </div>

          {/* QR */}
          <div className="w-full flex items-center justify-center bg-white rounded-2xl p-4">
            {loading ? (
              <div className="w-[280px] h-[280px] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="w-[280px] h-[280px] flex flex-col items-center justify-center gap-2">
                <p className="text-red-500 text-sm text-center">{error}</p>
              </div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR kod" className="w-[280px] h-[280px]" />
            ) : null}
          </div>

          <p className="text-slate-500 text-xs text-center">
            Xodim ushbu QR kodni telefondan skanerlaydi
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ open, onClose, onSuccess, currentUser }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: any
}) {
  const [form, setForm] = useState({
    scheduleId:  '',
    userId:      '',
    departmentId: currentUser?.departmentId ?? '',
    shiftDate:   '',
    startTime:   '',
    endTime:     '',
    shiftType:   ShiftType.Day,
    isOnCall:    false,
  })
  const [schedules,   setSchedules]   = useState<ScheduleResponseModel[]>([])
  const [users,       setUsers]       = useState<UserResponseModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ scheduleId: '', userId: '', departmentId: currentUser?.departmentId ?? '', shiftDate: '', startTime: '', endTime: '', shiftType: ShiftType.Day, isOnCall: false })
    setError(''); setSuccess(false)
    scheduleService.getAll().then(r => { if (r.data.succedded) setSchedules(r.data.result ?? []) })
    userService.getAll().then(r => { if (r.data.succedded) setUsers(r.data.result ?? []) })
  }, [open])

  useEffect(() => {
    if (!form.scheduleId) return
    const schedule = schedules.find(s => s.id === form.scheduleId)
    if (schedule) setForm(f => ({ ...f, departmentId: schedule.departmentId }))
  }, [form.scheduleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.scheduleId)  { setError('Jadval tanlang'); return }
    if (!form.userId)      { setError('Xodim tanlang'); return }
    if (!form.shiftDate)   { setError('Smena sanasini kiriting'); return }
    if (!form.startTime)   { setError('Boshlanish vaqtini kiriting'); return }
    if (!form.endTime)     { setError('Tugash vaqtini kiriting'); return }
    if (new Date(form.shiftDate) < new Date(new Date().toDateString())) {
      setError("O'tgan kunlarga smena tayinlab bo'lmaydi"); return
    }
    setLoading(true); setError('')
    try {
      const res = await shiftService.create({
        scheduleId:   form.scheduleId,
        userId:       form.userId,
        departmentId: form.departmentId,
        shiftDate:    form.shiftDate,
        startTime:    form.startTime + ':00',
        endTime:      form.endTime + ':00',
        shiftType:    form.shiftType,
        isOnCall:     form.isOnCall,
      })
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi'); return }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? err?.response?.data?.Errors?.[0] ?? "Serverga ulanishda xatolik")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = form.departmentId
    ? users.filter(u => u.departmentId === form.departmentId)
    : users

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Yangi smena</h2>
            <p className="text-slate-500 text-xs mt-0.5">Xodimga smena tayinlang</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Smena qo'shildi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Jadval *</label>
                <select value={form.scheduleId} onChange={e => setForm(f => ({ ...f, scheduleId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all">
                  <option value="">Jadval tanlang</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.departmentName} · {s.hospitalName} — {fmtDate(s.weekStart)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Xodim *</label>
                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all">
                  <option value="">Xodim tanlang</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Smena sanasi *</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={form.shiftDate}
                  onChange={e => setForm(f => ({ ...f, shiftDate: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Boshlanish *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tugash *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Smena turi *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[ShiftType.Day, ShiftType.Night, ShiftType.OnCall].map(t => {
                    const tc = SHIFT_TYPE_CONFIG[t]
                    const selected = form.shiftType === t
                    return (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, shiftType: t }))}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${selected ? `${tc.bg} ${tc.color}` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                        {tc.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3">
                <input type="checkbox" id="isOnCall" checked={form.isOnCall}
                  onChange={e => setForm(f => ({ ...f, isOnCall: e.target.checked }))}
                  className="w-4 h-4 rounded accent-cyan-500" />
                <label htmlFor="isOnCall" className="text-slate-300 text-sm cursor-pointer">
                  Navbatchi (On-Call) — kutilmagan chaqiriqqa tayyor
                </label>
              </div>
              <div className="pt-1">
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Qo'shilmoqda...</span></>
                    : "Smena qo'shish"
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
function DeleteModal({ shift, onClose, onConfirm, loading }: {
  shift: ShiftResponseModel | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!shift) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon d={IC.trash} className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-white font-bold text-center text-lg mb-1">Smenani o'chirish</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          <span className="text-white font-medium">{shift.userFullName}</span> ning {fmtDate(shift.shiftDate)} smenasini o'chirishni tasdiqlaysizmi?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all text-sm font-medium">
            Bekor qilish
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShiftsPage() {
  const { user: currentUser } = useAuth()
  const currentRole = currentUser?.roleType ?? 'Employee'

  const [shifts,      setShifts]      = useState<ShiftResponseModel[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showAutoGenerate, setShowAutoGenerate] = useState(false)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState<string>('all')
  const [dateFilter,  setDateFilter]  = useState<string>('all')
  const [showAdd,     setShowAdd]     = useState(false)
  const [deleteItem,  setDeleteItem]  = useState<ShiftResponseModel | null>(null)
  const [delLoading,  setDelLoading]  = useState(false)
  const [qrShift,     setQrShift]     = useState<ShiftResponseModel | null>(null)

  const canManage = ['SuperAdmin', 'HospitalAdmin', 'DeptHead'].includes(currentRole)

  const fetchShifts = async () => {
    setLoading(true)
    try {
      let res
      if (currentRole === 'Employee') {
        res = await shiftService.getByUser(currentUser?.id ?? '')
      } else {
        res = await shiftService.getAll()
      }
      if (res?.data.succedded) setShifts(res.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchShifts() }, [])

  const handleDelete = async () => {
    if (!deleteItem) return
    setDelLoading(true)
    try {
      await shiftService.delete(deleteItem.id)
      setDeleteItem(null)
      fetchShifts()
    } finally {
      setDelLoading(false)
    }
  }

  const today = new Date().toDateString()

  const filtered = shifts.filter(s => {
    const matchSearch = s.userFullName?.toLowerCase().includes(search.toLowerCase()) ||
                        s.departmentName?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || s.shiftType === Number(typeFilter)
    const matchDate = dateFilter === 'all'
      ? true
      : dateFilter === 'today'
        ? new Date(s.shiftDate).toDateString() === today
        : dateFilter === 'upcoming'
          ? new Date(s.shiftDate) > new Date()
          : true
    return matchSearch && matchType && matchDate
  })

  const todayCount     = shifts.filter(s => new Date(s.shiftDate).toDateString() === today).length
  const upcomingCount  = shifts.filter(s => new Date(s.shiftDate) > new Date()).length
  const completedCount = shifts.filter(s => s.status === ShiftStatus.Completed).length

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Smenalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Jami {shifts.length} ta smena</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAutoGenerate(true)}
              className="flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all"
            >
              ⚡ Avtomatik tuzish
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm"
            >
              <Icon d={IC.plus} className="w-4 h-4" />
              Yangi smena
            </button>
          </div>
        )}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Bugun',     value: todayCount,     color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20'       },
          { label: 'Kelgusi',   value: upcomingCount,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'       },
          { label: 'Bajarilgan',value: completedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
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
            placeholder="Xodim yoki bo'lim bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[140px]">
          <option value="all">Barcha sanalar</option>
          <option value="today">Bugun</option>
          <option value="upcoming">Kelgusi</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[140px]">
          <option value="all">Barcha turlar</option>
          <option value={ShiftType.Day}>Kunduzgi</option>
          <option value={ShiftType.Night}>Tungi</option>
          <option value={ShiftType.OnCall}>Navbatchi</option>
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
              <Icon d={IC.shifts} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Smenalar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Xodim</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Bo'lim</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Sana</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Vaqt</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Tur</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    {canManage && <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amallar</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(s => {
                    const tc = SHIFT_TYPE_CONFIG[s.shiftType]
                    const sc = SHIFT_STATUS_CONFIG[s.status]
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor(s.userFullName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {getInitials(s.userFullName)}
                            </div>
                            <p className="text-white text-sm font-medium">{s.userFullName}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-400 text-sm">{s.departmentName}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-white text-sm">{fmtDate(s.shiftDate)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-400 text-sm">{fmtTime(s.startTime)} — {fmtTime(s.endTime)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tc.bg} ${tc.color}`}>
                            {tc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              {/* QR tugma — har doim ko'rinadi */}
                              <button
                                onClick={() => setQrShift(s)}
                                title="QR kodini ko'rish"
                                className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 flex items-center justify-center transition-all"
                              >
                                <Icon d={IC.qr} className="w-4 h-4" />
                              </button>
                              {/* O'chirish — faqat Scheduled */}
                              {s.status === ShiftStatus.Scheduled && (
                                <button
                                  onClick={() => setDeleteItem(s)}
                                  title="O'chirish"
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all"
                                >
                                  <Icon d={IC.trash} className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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
              {filtered.map(s => {
                const tc = SHIFT_TYPE_CONFIG[s.shiftType]
                const sc = SHIFT_STATUS_CONFIG[s.status]
                return (
                  <div key={s.id} className="px-4 py-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(s.userFullName)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {getInitials(s.userFullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium truncate">{s.userFullName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${tc.bg} ${tc.color}`}>
                          {tc.label}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{s.departmentName}</p>
                      <p className="text-slate-400 text-xs">{fmtDate(s.shiftDate)} · {fmtTime(s.startTime)}–{fmtTime(s.endTime)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium mt-1 inline-block ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    {canManage && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => setQrShift(s)}
                          className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-all">
                          <Icon d={IC.qr} className="w-4 h-4" />
                        </button>
                        {s.status === ShiftStatus.Scheduled && (
                          <button onClick={() => setDeleteItem(s)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all">
                            <Icon d={IC.trash} className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <AutoGenerateModal
        open={showAutoGenerate}
        onClose={() => setShowAutoGenerate(false)}
        onSuccess={fetchShifts}
        currentUser={currentUser}
        currentRole={currentRole}
      />

      <QrModal shift={qrShift} onClose={() => setQrShift(null)} />
      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchShifts} currentUser={currentUser} />
      <DeleteModal shift={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={delLoading} />
    </div>
  )
}