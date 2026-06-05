import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AutoGenerateModal } from '../shifts/AutoGenerateModal'
import { scheduleService, hospitalService, departmentService } from '../../services'
import type { ScheduleResponseModel, HospitalResponseModel, DepartmentResponseModel } from '../../types'
import { ScheduleStatus } from '../../types'
import { ScheduleCalendarView } from './ScheduleCalendarView'
import { AutoWeekModal } from './AutoWeekModal'

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
  schedule: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  close:    'M6 18L18 6M6 6l12 12',
  trash:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  check:    'M5 13l4 4L19 7',
  eye:      'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  archive:  'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  dept:     'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
}

const STATUS_CONFIG = {
  [ScheduleStatus.Draft]:     { label: 'Loyiha',       color: 'text-slate-400',   bg: 'bg-slate-700/50 border-slate-600'           },
  [ScheduleStatus.Published]: { label: 'Nashr etilgan', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30'    },
  [ScheduleStatus.Archived]:  { label: 'Arxivlangan',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'        },
}

function fmtDate(d: string) {
  const date = new Date(d)
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  return `${date.getDate()}-${months[date.getMonth()]}, ${date.getFullYear()}`
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ open, onClose, onSuccess, currentRole, currentUser }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentRole: string
  currentUser: any
}) {
  const [form, setForm] = useState({
    hospitalId:   currentUser?.hospitalId ?? '',
    departmentId: currentUser?.departmentId ?? '',
    weekStart:    '',
    weekEnd:      '',
  })
  const [hospitals,   setHospitals]   = useState<HospitalResponseModel[]>([])
  const [departments, setDepartments] = useState<DepartmentResponseModel[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ hospitalId: currentUser?.hospitalId ?? '', departmentId: currentUser?.departmentId ?? '', weekStart: '', weekEnd: '' })
    setError('')
    setSuccess(false)
    if (currentRole === 'SuperAdmin') {
      hospitalService.getAll().then(r => { if (r.data.succedded) setHospitals(r.data.result ?? []) })
    } else if (currentUser?.hospitalId) {
      departmentService.getByHospital(currentUser.hospitalId).then(r => {
        if (r.data.succedded) setDepartments(r.data.result ?? [])
      })
    }
  }, [open])

  useEffect(() => {
    if (!form.hospitalId) { setDepartments([]); return }
    departmentService.getByHospital(form.hospitalId).then(r => {
      if (r.data.succedded) setDepartments(r.data.result ?? [])
    })
    setForm(f => ({ ...f, departmentId: '' }))
  }, [form.hospitalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.hospitalId)   { setError('Shifoxonani tanlang'); return }
    if (!form.departmentId) { setError("Bo'limni tanlang"); return }
    if (!form.weekStart)    { setError('Hafta boshlanish sanasini kiriting'); return }
    if (!form.weekEnd)      { setError('Hafta tugash sanasini kiriting'); return }
    if (new Date(form.weekEnd) <= new Date(form.weekStart)) {
      setError('Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak'); return
    }
    if (new Date(form.weekStart).getDay() !== 1) {
      setError("Hafta boshlanishi Dushanba bo'lishi kerak")
      return
    }

    setLoading(true); setError('')
    try {
      const res = await scheduleService.create({
        ...form,
        createdBy: currentUser?.id ?? '',
      })
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
            <h2 className="text-white font-bold text-lg">Yangi jadval</h2>
            <p className="text-slate-500 text-xs mt-0.5">Haftalik ish jadvalini yarating</p>
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
              <p className="text-white font-semibold">Jadval yaratildi!</p>
              <p className="text-slate-400 text-sm">Loyiha holatida saqlandi</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Shifoxona — SuperAdmin uchun */}
              {currentRole === 'SuperAdmin' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Shifoxona *</label>
                  <select
                    value={form.hospitalId}
                    onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  >
                    <option value="">Shifoxona tanlang</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              )}

              {/* Bo'lim */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Bo'lim</label>
                {currentRole === 'DeptHead' ? (
                  <div className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm">
                    {currentUser?.departmentName ?? "Bo'lim"}
                  </div>
                ) : (
                  <select
                    value={form.departmentId}
                    onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                    disabled={!form.hospitalId}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-40"
                  >
                    <option value="">Bo'lim tanlang</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>

              {/* Hafta sanasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Boshlanish sanasi *</label>
                  <input
                    type="date"
                    value={form.weekStart}
                    onChange={e => {
                      const date = new Date(e.target.value)
                      if (date.getDay() !== 1) { // 1 = Dushanba
                        setError("Hafta boshlanishi Dushanba bo'lishi kerak")
                        return
                      }
                      setError('')
                      setForm(f => ({ ...f, weekStart: e.target.value }))
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tugash sanasi *</label>
                  <input
                    type="date"
                    value={form.weekEnd}
                    onChange={e => setForm(f => ({ ...f, weekEnd: e.target.value }))}
                    min={form.weekStart}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Yaratilmoqda...</span></>
                    : 'Jadval yaratish'
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

// ── Status change modal ───────────────────────────────────────────────────────
function StatusModal({ schedule, onClose, onConfirm, loading }: {
  schedule: ScheduleResponseModel | null
  onClose: () => void
  onConfirm: (status: ScheduleStatus) => void
  loading: boolean
}) {
  if (!schedule) return null
  const current = schedule.status

  const actions = [
    current === ScheduleStatus.Draft && {
      status: ScheduleStatus.Published,
      label: 'Nashr etish',
      icon: IC.eye,
      color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30',
      desc: 'Jadval xodimlarga ko\'rinadi',
    },
    current === ScheduleStatus.Published && {
      status: ScheduleStatus.Archived,
      label: 'Arxivlash',
      icon: IC.archive,
      color: 'bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30',
      desc: 'Jadval arxivga o\'tkaziladi',
    },
    current === ScheduleStatus.Archived && {
      status: ScheduleStatus.Draft,
      label: 'Loyihaga qaytarish',
      icon: IC.schedule,
      color: 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600',
      desc: 'Jadval loyiha holatiga qaytadi',
    },
  ].filter(Boolean) as any[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">Jadval holati</h3>
        <p className="text-slate-400 text-sm mb-5 truncate">{schedule.departmentName} — {fmtDate(schedule.weekStart)}</p>
        <div className="space-y-2">
          {actions.map(a => (
            <button
              key={a.status}
              onClick={() => onConfirm(a.status)}
              disabled={loading}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${a.color}`}
            >
              <Icon d={a.icon} className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <p>{a.label}</p>
                <p className="text-xs opacity-70">{a.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium">
          Bekor qilish
        </button>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ schedule, onClose, onConfirm, loading }: {
  schedule: ScheduleResponseModel | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!schedule) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon d={IC.trash} className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-white font-bold text-center text-lg mb-1">Jadval o'chirish</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          <span className="text-white font-medium">{schedule.departmentName}</span> jadvalini o'chirishni tasdiqlaysizmi?
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
export default function SchedulesPage() {
  const { user: currentUser } = useAuth()
  const currentRole = currentUser?.roleType ?? 'Employee'

  const [schedules,    setSchedules]    = useState<ScheduleResponseModel[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAdd,      setShowAdd]      = useState(false)
  const [statusItem,   setStatusItem]   = useState<ScheduleResponseModel | null>(null)
  const [deleteItem,   setDeleteItem]   = useState<ScheduleResponseModel | null>(null)
  const [autoGenSched, setAutoGenSched] = useState<ScheduleResponseModel | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [delLoading,   setDelLoading]   = useState(false)
  const [showAutoWeek, setShowAutoWeek] = useState(false)
  const [calendarSchedule, setCalendarSchedule] = useState<ScheduleResponseModel | null>(null)

  const canManage = ['SuperAdmin', 'HospitalAdmin', 'DeptHead'].includes(currentRole)

  const fetchSchedules = async () => {
  setLoading(true)
  try {
    const res = await scheduleService.getAll()
    console.log('currentUser:', currentUser)           // ← qo'shildi
    console.log('departmentId:', currentUser?.departmentId) // ← qo'shildi
    if (res.data.succedded) {
  let result = res.data.result ?? []
  if ((currentRole === 'DeptHead' || currentRole === 'Employee') 
       && currentUser?.departmentId) {
    result = result.filter(s => s.departmentId === currentUser.departmentId)
  }
  setSchedules(result)
}
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchSchedules() }, [])

  const handleStatusChange = async (newStatus: ScheduleStatus) => {
    if (!statusItem) return
    setStatusLoading(true)
    try {
      await scheduleService.update(statusItem.id, {
        weekStart: statusItem.weekStart,
        weekEnd:   statusItem.weekEnd,
        status:    newStatus,
      })
      setStatusItem(null)
      fetchSchedules()
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDelLoading(true)
    try {
      await scheduleService.delete(deleteItem.id)
      setDeleteItem(null)
      fetchSchedules()
    } finally {
      setDelLoading(false)
    }
  }

  const filtered = schedules.filter(s => {
    const matchSearch = s.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
                        s.hospitalName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === Number(statusFilter)
    return matchSearch && matchStatus
  })

  const draftCount     = schedules.filter(s => s.status === ScheduleStatus.Draft).length
  const publishedCount = schedules.filter(s => s.status === ScheduleStatus.Published).length
  const archivedCount  = schedules.filter(s => s.status === ScheduleStatus.Archived).length

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Jadvallar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Jami {schedules.length} ta jadval</p>
        </div>
        {canManage && (
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAutoWeek(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all shadow-lg shadow-violet-500/20">
            ⚡ Avtomatik tuzish
          </button>
          <button
          onClick={() => setShowAdd(true)}
           className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm">
           <Icon d={IC.plus} className="w-4 h-4" />
               Yangi jadval
           </button>
        </div>
      )}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Loyiha',        value: draftCount,     color: 'text-slate-400',   bg: 'bg-slate-700/50 border-slate-600'         },
          { label: 'Nashr etilgan', value: publishedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20'  },
          { label: 'Arxivlangan',   value: archivedCount,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'      },
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
            placeholder="Bo'lim yoki shifoxona bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[160px]"
        >
          <option value="all">Barcha holatlar</option>
          <option value={ScheduleStatus.Draft}>Loyiha</option>
          <option value={ScheduleStatus.Published}>Nashr etilgan</option>
          <option value={ScheduleStatus.Archived}>Arxivlangan</option>
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
              <Icon d={IC.schedule} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Jadvallar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Bo'lim</th>
                    {currentRole === 'SuperAdmin' && (
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Shifoxona</th>
                    )}
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Hafta</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    {canManage && <th className="px-5 py-3.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(s => {
                    const sc = STATUS_CONFIG[s.status]
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                              <Icon d={IC.dept} className="w-4 h-4" />
                            </div>
                            <p className="text-white text-sm font-medium">{s.departmentName}</p>
                          </div>
                        </td>
                        {currentRole === 'SuperAdmin' && (
                          <td className="px-5 py-3.5">
                            <p className="text-slate-400 text-sm truncate max-w-[180px]">{s.hospitalName}</p>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <p className="text-white text-sm">{fmtDate(s.weekStart)}</p>
                          <p className="text-slate-500 text-xs">— {fmtDate(s.weekEnd)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setAutoGenSched(s)}
                                title="Avtomatik smenalar tuzish"
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-violet-500/20 text-slate-500 hover:text-violet-400 flex items-center justify-center transition-all"
                              >
                                <Icon d="M13 10V3L4 14h7v7l9-11h-7z" className="w-4 h-4" />
                              </button>
                              <button
                                  onClick={() => setCalendarSchedule(s)}
                                  title="Haftalik jadval"
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all"
                                >
                                  <Icon d={IC.schedule} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setStatusItem(s)}
                                title="Holatni o'zgartirish"
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all"
                              >
                                <Icon d={IC.eye} className="w-4 h-4" />
                              </button>
                              {s.status === ScheduleStatus.Draft && (
                                <button
                                  onClick={() => setDeleteItem(s)}
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
                const sc = STATUS_CONFIG[s.status]
                return (
                  <div key={s.id} className="px-4 py-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <Icon d={IC.dept} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium truncate">{s.departmentName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      {currentRole === 'SuperAdmin' && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{s.hospitalName}</p>
                      )}
                      <p className="text-slate-400 text-xs mt-0.5">{fmtDate(s.weekStart)} — {fmtDate(s.weekEnd)}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
  <button
    onClick={() => setCalendarSchedule(s)}
    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all">
    <Icon d={IC.schedule} className="w-4 h-4" />
  </button>
  {canManage && (
    <button
      onClick={() => setStatusItem(s)}
      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all">
      <Icon d={IC.eye} className="w-4 h-4" />
    </button>
  )}
</div>
                  </div>
                )}
              )}
            </div>
          </>
        )}
      </div>

      <AddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchSchedules}
        currentRole={currentRole}
        currentUser={currentUser}
      />
      <AutoWeekModal
        open={showAutoWeek}
        onClose={() => setShowAutoWeek(false)}
        onSuccess={fetchSchedules}
        currentUser={currentUser}
        currentRole={currentRole}
      />
      <StatusModal
        schedule={statusItem}
        onClose={() => setStatusItem(null)}
        onConfirm={handleStatusChange}
        loading={statusLoading}
      />
      {calendarSchedule && (
        <ScheduleCalendarView
          schedule={calendarSchedule}
          onClose={() => setCalendarSchedule(null)}
        />
      )}
      {autoGenSched && (
        <AutoGenerateModal
          open={!!autoGenSched}
          onClose={() => setAutoGenSched(null)}
          onSuccess={() => { fetchSchedules(); setAutoGenSched(null) }}
          currentUser={currentUser}
          currentRole={currentRole}
          preSelectedScheduleId={autoGenSched.id}
          preSelectedDepartmentId={autoGenSched.departmentId}
          preSelectedWeekStart={autoGenSched.weekStart?.split('T')[0]}
        />
      )}
      <DeleteModal
        schedule={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={delLoading}
      />
    </div>
  )
}