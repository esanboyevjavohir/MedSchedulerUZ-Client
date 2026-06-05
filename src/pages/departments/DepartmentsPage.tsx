import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { departmentService, hospitalService, userService } from '../../services'
import type { DepartmentResponseModel, HospitalResponseModel, UserResponseModel } from '../../types'

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
  dept:    'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  hospital:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  close: 'M6 18L18 6M6 6l12 12',
  check:   'M5 13l4 4L19 7',
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ open, onClose, onSuccess, currentRole, currentHospitalId }: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentRole: string
  currentHospitalId?: string
}) {
  const [form, setForm] = useState({ hospitalId: currentHospitalId ?? '', name: '', minStaffRequired: 3 })
  const [hospitals, setHospitals] = useState<HospitalResponseModel[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ hospitalId: currentHospitalId ?? '', name: '', minStaffRequired: 3 })
    setError('')
    setSuccess(false)
    if (currentRole === 'SuperAdmin') {
      hospitalService.getAll().then(r => {
        if (r.data.succedded) setHospitals(r.data.result ?? [])
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.hospitalId) { setError('Shifoxonani tanlang'); return }
    if (!form.name.trim()) { setError("Bo'lim nomini kiriting"); return }
    if (form.minStaffRequired < 1) { setError("Minimal xodim soni 1 dan kam bo'lmasligi kerak"); return }

    setLoading(true)
    setError('')
    try {
      const res = await departmentService.create(form)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Yangi bo'lim</h2>
            <p className="text-slate-500 text-xs mt-0.5">Ma'lumotlarni to'ldiring</p>
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
              <p className="text-white font-semibold">Bo'lim qo'shildi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Shifoxona — faqat SuperAdmin */}
              {currentRole === 'SuperAdmin' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Shifoxona *</label>
                  <select
                    value={form.hospitalId}
                    onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                               focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  >
                    <option value="">Shifoxona tanlang</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bo'lim nomi */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Bo'lim nomi *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Kardiologiya bo'limi"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* MinStaffRequired */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Minimal xodim soni *</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, minStaffRequired: Math.max(1, f.minStaffRequired - 1) }))}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 flex items-center justify-center text-lg font-bold transition-all flex-shrink-0"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    value={form.minStaffRequired}
                    onChange={e => setForm(f => ({ ...f, minStaffRequired: Number(e.target.value) }))}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white text-center
                               rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                               focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, minStaffRequired: f.minStaffRequired + 1 }))}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 flex items-center justify-center text-lg font-bold transition-all flex-shrink-0"
                  >+</button>
                </div>
                <p className="text-slate-600 text-xs mt-1.5">Bu bo'limda ishlashi kerak bo'lgan minimal xodim soni</p>
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
                    : "Bo'lim qo'shish"
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

function UsersModal({ dept, onClose }: {
  dept: DepartmentResponseModel | null
  onClose: () => void
}) {
  const [users,   setUsers]   = useState<UserResponseModel[]>([])
  const [loading, setLoading] = useState(false)

  const AVATAR_COLORS = [
    'from-cyan-400 to-blue-600', 'from-violet-400 to-purple-600',
    'from-emerald-400 to-teal-600', 'from-amber-400 to-orange-600',
    'from-rose-400 to-pink-600', 'from-blue-400 to-indigo-600',
  ]
  const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const getInitials = (name: string) => name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()

  const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    SuperAdmin:    { label: 'Super Admin',      color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
    HospitalAdmin: { label: 'Shifoxona Admin',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30'   },
    DeptHead:      { label: "Bo'lim boshlig'i", color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'   },
    Employee:      { label: 'Xodim',            color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/30'},
  }

  useEffect(() => {
    if (!dept) return
    setLoading(true)
    userService.getAll().then(r => {
      if (r.data.succedded) {
        const deptUsers = (r.data.result ?? []).filter(u => u.departmentId === dept.id)
        setUsers(deptUsers)
      }
    }).finally(() => setLoading(false))
  }, [dept])

  if (!dept) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">{dept.name}</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {dept.hospitalName} · Min. {dept.minStaffRequired} xodim
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                <Icon d={IC.users} className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm">Bu bo'limda xodim yo'q</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-slate-400 text-xs">Jami <span className="text-white font-semibold">{users.length}</span> ta xodim</p>
              </div>
              <div className="divide-y divide-slate-800">
                {users.map(u => {
                  const rc = ROLE_CONFIG[u.roleType] ?? { label: u.roleType, color: 'text-slate-400', bg: 'bg-slate-700' }
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(u.fullName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {getInitials(u.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.fullName}</p>
                        <p className="text-slate-500 text-xs truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${rc.bg} ${rc.color}`}>
                          {rc.label}
                        </span>
                        {u.specializationName && (
                          <span className="text-[10px] text-slate-500">{u.specializationName}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ dept, onClose, onConfirm, loading }: {
  dept: DepartmentResponseModel | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!dept) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon d={IC.trash} className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-white font-bold text-center text-lg mb-1">Bo'limni o'chirish</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          <span className="text-white font-medium">{dept.name}</span> ni o'chirishni tasdiqlaysizmi?
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
export default function DepartmentsPage() {
  const { user: currentUser } = useAuth()
  const currentRole = currentUser?.roleType ?? 'Employee'

  const [departments,  setDepartments]  = useState<DepartmentResponseModel[]>([])
  const [usersModal, setUsersModal] = useState<DepartmentResponseModel | null>(null)
  const [hospitals,    setHospitals]    = useState<HospitalResponseModel[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [hospitalFilter, setHospitalFilter] = useState<string>('all')
  const [showAdd,      setShowAdd]      = useState(false)
  const [deleteItem,   setDeleteItem]   = useState<DepartmentResponseModel | null>(null)
  const [delLoading,   setDelLoading]   = useState(false)

  const canAdd = ['SuperAdmin', 'HospitalAdmin'].includes(currentRole)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      let res
      if (currentRole === 'SuperAdmin') {
        res = await departmentService.getAll()
      } else {
        // HospitalAdmin va boshqalar o'z shifoxonasining bo'limlarini ko'radi
        const hId = currentUser?.hospitalId as string
        if (hId) {
          res = await departmentService.getByHospital(hId)
        }
      }
      if (res?.data.succedded) setDepartments(res.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
    if (currentRole === 'SuperAdmin') {
      hospitalService.getAll().then(r => {
        if (r.data.succedded) setHospitals(r.data.result ?? [])
      })
    }
  }, [])

  const handleDelete = async () => {
    if (!deleteItem) return
    setDelLoading(true)
    try {
      await departmentService.delete(deleteItem.id)
      setDeleteItem(null)
      fetchDepartments()
    } finally {
      setDelLoading(false)
    }
  }

  const filtered = departments.filter(d => {
    const matchSearch   = d.name.toLowerCase().includes(search.toLowerCase()) ||
                          (d.hospitalName ?? '').toLowerCase().includes(search.toLowerCase())
    const matchHospital = hospitalFilter === 'all' || d.hospitalId === hospitalFilter
    return matchSearch && matchHospital
  })

  const hospitalId = currentUser?.hospitalId as string | undefined

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Bo'limlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Jami {departments.length} ta bo'lim</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600
                       hover:from-cyan-400 hover:to-blue-500 text-white font-semibold
                       rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm"
          >
            <Icon d={IC.plus} className="w-4 h-4" />
            Yangi bo'lim
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
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
            placeholder="Nom yoki shifoxona bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600
                       rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500
                       focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>

        {/* Hospital filter — SuperAdmin uchun */}
        {currentRole === 'SuperAdmin' && (
          <select
            value={hospitalFilter}
            onChange={e => setHospitalFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm
                       focus:outline-none focus:border-cyan-500 transition-all min-w-[200px]"
          >
            <option value="all">Barcha shifoxonalar</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}
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
              <Icon d={IC.dept} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Bo'limlar topilmadi</p>
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
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Min. xodim</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    {canAdd && <th className="px-5 py-3.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => setUsersModal(d)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <Icon d={IC.dept} className="w-4 h-4" />
                          </div>
                          <p className="text-white text-sm font-medium">{d.name}</p>
                        </div>
                      </td>
                      {currentRole === 'SuperAdmin' && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                            <Icon d={IC.hospital} className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                            <span className="truncate max-w-[200px]">{d.hospitalName}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-3 py-1.5">
                            <Icon d={IC.users} className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-white text-sm font-semibold">{d.minStaffRequired}</span>
                          </div>
                          <span className="text-slate-500 text-xs">ta xodim</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${d.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                          {d.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      {canAdd && (
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setDeleteItem(d)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all"
                          >
                            <Icon d={IC.trash} className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map(d => (
                <div key={d.id} className="px-4 py-4 flex items-start gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => setUsersModal(d)}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Icon d={IC.dept} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm font-medium truncate">{d.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium flex-shrink-0 ${d.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                        {d.isActive ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    {currentRole === 'SuperAdmin' && (
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{d.hospitalName}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Icon d={IC.users} className="w-3 h-3 text-cyan-400" />
                      <span className="text-slate-400 text-xs">{d.minStaffRequired} ta min. xodim</span>
                    </div>
                  </div>
                  {canAdd && (
                    <button
                      onClick={() => setDeleteItem(d)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <Icon d={IC.trash} className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchDepartments}
        currentRole={currentRole}
        currentHospitalId={hospitalId}
      />
      <DeleteModal
        dept={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={delLoading}
      />

      <UsersModal 
        dept={usersModal} 
        onClose={() => setUsersModal(null)} 
      />
    </div>
  )
}