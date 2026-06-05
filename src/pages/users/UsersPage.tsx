import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'
import {
  userService,
  hospitalService,
  departmentService,
  specializationService,
} from '../../services'
import type {
  UserResponseModel,
  HospitalResponseModel,
  DepartmentResponseModel,
  SpecializationResponseModel,
} from '../../types'
import { UserRole } from '../../types'

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
  search:  'M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  close:   'M6 18L18 6M6 6l12 12',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  spinner: 'M4 12a8 8 0 018-8',
  chevron: 'M19 9l-7 7-7-7',
  email:   'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:   'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
}

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SuperAdmin:    { label: 'Super Admin',      color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  HospitalAdmin: { label: 'Shifoxona Admin',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30'   },
  DeptHead:      { label: "Bo'lim boshlig'i", color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'   },
  Employee:      { label: 'Xodim',            color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/30'},
}

const ROLE_OPTIONS = [
  { value: UserRole.SuperAdmin,    label: 'Super Admin'      },
  { value: UserRole.HospitalAdmin, label: 'Shifoxona Admin'  },
  { value: UserRole.DeptHead,      label: "Bo'lim boshlig'i" },
  { value: UserRole.Employee,      label: 'Xodim'            },
]

function getAvailableRoles(currentRole: string) {
  if (currentRole === 'SuperAdmin')
    return ROLE_OPTIONS.filter(r => r.value !== UserRole.SuperAdmin) // SuperAdmin o'zini qo'shmasin
  if (currentRole === 'HospitalAdmin')
    return ROLE_OPTIONS.filter(r =>
      r.value === UserRole.DeptHead || r.value === UserRole.Employee) // faqat DeptHead va Employee
  if (currentRole === 'DeptHead')
    return ROLE_OPTIONS.filter(r => r.value === UserRole.Employee) // faqat Employee
  return []
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-cyan-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-rose-400 to-pink-600',
  'from-blue-400 to-indigo-600',
]

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentRole: string
  currentHospitalId?: string
  currentDepartmentId?: string
}

function RegisterModal({ open, onClose, onSuccess, currentRole, currentHospitalId, currentDepartmentId }: 
    ModalProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    hospitalId: currentHospitalId ?? '',
    departmentId: '',
    specializationId: '',
    roleType: UserRole.Employee,
  })
  const [hospitals,       setHospitals]       = useState<HospitalResponseModel[]>([])
  const [departments,     setDepartments]      = useState<DepartmentResponseModel[]>([])
  const [specializations, setSpecializations]  = useState<SpecializationResponseModel[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const availableRoles = getAvailableRoles(currentRole)
  const needsDept = form.roleType === UserRole.DeptHead || form.roleType === UserRole.Employee
  const needsSpec = form.roleType === UserRole.Employee

  // Load hospitals (SuperAdmin only)
  useEffect(() => {
    if (!open) return
    if (currentRole === 'SuperAdmin') {
        hospitalService.getAll().then(r => {
            if (r.data.succedded) setHospitals(r.data.result ?? [])
        })
        } else if (currentRole === 'HospitalAdmin') {
        // O'z shifoxonasini avtomatik set qiladi, list kerak emas
        // currentHospitalId allaqachon form.hospitalId da bor
        }
    // Reset form
    setForm({
      fullName: '', email: '', phoneNumber: '',
      hospitalId: currentHospitalId ?? '',
      departmentId: '', specializationId: '',
      roleType: UserRole.Employee,
    })
    setError('')
    setSuccess(false)
  }, [open])

  // Load departments when hospitalId changes
  // Departments load
useEffect(() => {
  if (!open) return
  
  // DeptHead o'z bo'limini avtomatik oladi
  if (currentRole === 'DeptHead' && currentDepartmentId) {
    departmentService.getByHospital(currentHospitalId!).then(r => {
      if (r.data.succedded) setDepartments(r.data.result ?? [])
    })
    setForm(f => ({ ...f, departmentId: currentDepartmentId }))
    return
  }

  if (!form.hospitalId) { setDepartments([]); return }
  departmentService.getByHospital(form.hospitalId).then(r => {
    if (r.data.succedded) setDepartments(r.data.result ?? [])
  })
  setForm(f => ({ ...f, departmentId: '', specializationId: '' }))
}, [form.hospitalId, open])

  // Load specializations when departmentId changes
  useEffect(() => {
    if (!form.departmentId) { setSpecializations([]); return }
    specializationService.getByDepartment(form.departmentId).then(r => {
      if (r.data.succedded) setSpecializations(r.data.result ?? [])
    })
    setForm(f => ({ ...f, specializationId: '' }))
  }, [form.departmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validatsiya
    if (!form.fullName.trim()) { setError("To'liq ismni kiriting"); return }
    if (!form.email.trim())    { setError('Emailni kiriting'); return }
    if (!form.hospitalId)      { setError('Shifoxonani tanlang'); return }
    if (needsDept && !form.departmentId)      { setError("Bo'limni tanlang"); return }
    if (needsSpec && !form.specializationId)  { setError('Mutaxassislikni tanlang'); return }

    setLoading(true)
    try {
      const payload = {
        fullName:         form.fullName,
        email:            form.email,
        phoneNumber:      form.phoneNumber || undefined,
        hospitalId:       form.hospitalId,
        departmentId:     needsDept && form.departmentId ? form.departmentId : undefined,
        specializationId: needsSpec && form.specializationId ? form.specializationId : undefined,
        roleType:         form.roleType,
      }
      const res = await userService.register(payload as any)
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Yangi xodim qo'shish</h2>
            <p className="text-slate-500 text-xs mt-0.5">Ma'lumotlarni to'ldiring — parol emailga yuboriladi</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">Xodim muvaffaqiyatli qo'shildi!</p>
              <p className="text-slate-400 text-sm text-center">Parol xodimning emailiga yuborildi</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Full name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">To'liq ism *</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                  placeholder="Ism Familiya Otasining ismi"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="email@misol.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefon raqami</label>
                <input
                  value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="+998901234567"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Rol *</label>
                <select
                  value={form.roleType}
                  onChange={e => setForm(f => ({ ...f, roleType: Number(e.target.value) as UserRole, departmentId: '', specializationId: '' }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                             focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                >
                  {availableRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Hospital — only SuperAdmin sees this */}
              {currentRole === 'SuperAdmin' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Shifoxona *</label>
                  <select
                    value={form.hospitalId}
                    onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
                    required
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

              {/* Department */}
              {needsDept && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Bo'lim *</label>
                  <select
                    value={form.departmentId}
                    onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                    required
                    disabled={!form.hospitalId}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                               focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                               transition-all disabled:opacity-40"
                  >
                    <option value="">Bo'lim tanlang</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specialization */}
              {needsSpec && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Mutaxassislik *</label>
                  <select
                    value={form.specializationId}
                    onChange={e => setForm(f => ({ ...f, specializationId: e.target.value }))}
                    required
                    disabled={!form.departmentId}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                               focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                               transition-all disabled:opacity-40"
                  >
                    <option value="">Mutaxassislik tanlang</option>
                    {specializations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                             disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Qo'shilmoqda...</span></>
                  ) : "Xodim qo'shish"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm, loading }: {
  user: UserResponseModel | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  if (!user) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Icon d={IC.trash} className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-white font-bold text-center text-lg mb-1">Xodimni o'chirish</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          <span className="text-white font-medium">{user.fullName}</span> ni o'chirishni tasdiqlaysizmi?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : null}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit User Modal ───────────────────────────────────────────────────────────
// 2. Bu komponentni RegisterModal dan keyin joylashtiring
// 3. UsersPage() ichiga state va handler qo'shing (pastda ko'rsatilgan)
// 4. Jadval qatoriga edit tugmasi qo'shing (pastda ko'rsatilgan)

interface EditModalProps {
  open: boolean
  user: UserResponseModel | null
  onClose: () => void
  onSuccess: () => void
  currentRole: string
  currentHospitalId?: string
  currentDepartmentId?: string
}

function EditUserModal({
  open, user, onClose, onSuccess,
  currentRole, currentHospitalId, currentDepartmentId,
}: EditModalProps) {
  const [form, setForm] = useState({
    fullName:         '',
    phoneNumber:      '',
    hospitalId:       '',
    departmentId:     '',
    specializationId: '',
    roleType:         UserRole.Employee as UserRole,
    isActive:         true,
  })
  const [hospitals,       setHospitals]       = useState<HospitalResponseModel[]>([])
  const [departments,     setDepartments]      = useState<DepartmentResponseModel[]>([])
  const [specializations, setSpecializations]  = useState<SpecializationResponseModel[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  // Rolga qarab maydonlar
  const isSuperAdmin    = currentRole === 'SuperAdmin'
  // HospitalAdmin va DeptHead faqat ism/telefon ko'radi
  const fullAccess = isSuperAdmin

  // Form ni user bilan to'ldirish
  useEffect(() => {
    if (!open || !user) return
    setForm({
      fullName:         user.fullName   ?? '',
      phoneNumber:      user.phoneNumber ?? '',
      hospitalId:       (user as any).hospitalId  ?? currentHospitalId ?? '',
      departmentId:     (user as any).departmentId ?? currentDepartmentId ?? '',
      specializationId: (user as any).specializationId ?? '',
      roleType:         (UserRole as any)[user.roleType] ?? UserRole.Employee,
      isActive:         user.isActive ?? true,
    })
    setError('')
    setSuccess(false)

    // SuperAdmin uchun shifoxonalar ro'yxatini yuklash
    if (isSuperAdmin) {
      hospitalService.getAll().then(r => {
        if (r.data.succedded) setHospitals(r.data.result ?? [])
      })
    }
  }, [open, user])

  // Shifoxona o'zgarganda bo'limlarni yuklash
  useEffect(() => {
    if (!open || !fullAccess) return
    const hid = form.hospitalId || currentHospitalId
    if (!hid) { setDepartments([]); return }
    departmentService.getByHospital(hid).then(r => {
      if (r.data.succedded) setDepartments(r.data.result ?? [])
    })
  }, [form.hospitalId, open])

  // Bo'lim o'zgarganda mutaxassisliklarni yuklash
  useEffect(() => {
    if (!open) return
    const did = form.departmentId || currentDepartmentId
    if (!did) { setSpecializations([]); return }
    specializationService.getByDepartment(did).then(r => {
      if (r.data.succedded) setSpecializations(r.data.result ?? [])
    })
  }, [form.departmentId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.fullName.trim()) { setError("To'liq ismni kiriting"); return }

    setLoading(true)
    setError('')
    try {
      // Rolga qarab payload
      const payload: any = {
        fullName:    form.fullName,
        phoneNumber: form.phoneNumber || undefined,
      }
      if (isSuperAdmin) {
        payload.hospitalId       = form.hospitalId       || undefined
        payload.departmentId     = form.departmentId     || undefined
        payload.specializationId = form.specializationId || undefined
        payload.roleType         = form.roleType
        payload.isActive         = form.isActive
      }

      const res = await userService.updateUser(user.id, payload)
      if (!res.data.succedded) {
        setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi')
        return
      }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1200)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !user) return null

  const needsDept = fullAccess && (form.roleType === UserRole.DeptHead || form.roleType === UserRole.Employee)
  const needsSpec = fullAccess && form.roleType === UserRole.Employee
  const availableRoles = getAvailableRoles(currentRole)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(user.fullName)} flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(user.fullName)}
            </div>
            <div>
              <h2 className="text-white font-bold text-base">{user.fullName}</h2>
              <p className="text-slate-500 text-xs">Ma'lumotlarni tahrirlash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold">Muvaffaqiyatli saqlandi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* To'liq ism */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">To'liq ism *</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  required
                  placeholder="Ism Familiya Otasining ismi"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefon raqami</label>
                <input
                  value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="+998901234567"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500
                             focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* SuperAdmin qo'shimcha maydonlari */}
              {fullAccess && (
                <>
                  {/* Rol */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Rol</label>
                    <select
                      value={form.roleType}
                      onChange={e => setForm(f => ({
                        ...f,
                        roleType: Number(e.target.value) as UserRole,
                        departmentId: '',
                        specializationId: '',
                      }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                                 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    >
                      {availableRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shifoxona */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Shifoxona</label>
                    <select
                      value={form.hospitalId}
                      onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value, departmentId: '', specializationId: '' }))}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                                 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    >
                      <option value="">Shifoxona tanlang</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bo'lim */}
                  {needsDept && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Bo'lim</label>
                      <select
                        value={form.departmentId}
                        onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, specializationId: '' }))}
                        disabled={!form.hospitalId}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                                   focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                                   transition-all disabled:opacity-40"
                      >
                        <option value="">Bo'lim tanlang</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mutaxassislik */}
                  {needsSpec && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Mutaxassislik</label>
                      <select
                        value={form.specializationId}
                        onChange={e => setForm(f => ({ ...f, specializationId: e.target.value }))}
                        disabled={!form.departmentId}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm
                                   focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                                   transition-all disabled:opacity-40"
                      >
                        <option value="">Mutaxassislik tanlang</option>
                        {specializations.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Faollik */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">Holat</label>
                    <div className="flex gap-3">
                      {[
                        { val: true,  label: 'Faol',    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
                        { val: false, label: 'Nofaol',  cls: 'border-slate-600 bg-slate-700/50 text-slate-400' },
                      ].map(opt => (
                        <button
                          key={String(opt.val)}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, isActive: opt.val }))}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                            ${form.isActive === opt.val
                              ? opt.cls + ' ring-1 ring-offset-0'
                              : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Submit */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white
                             hover:border-slate-600 transition-all text-sm font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                             disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all
                             flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saqlanmoqda...</span></>
                  ) : 'Saqlash'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const currentRole = currentUser?.roleType ?? 'Employee'

  const [users,       setUsers]       = useState<UserResponseModel[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const filter = params.get('filter')
    if (filter === 'inactive') setRoleFilter('inactive')
    else if (filter === 'new') setRoleFilter('new')
    else setRoleFilter('all')
  }, [location.search])
  const [roleFilter,  setRoleFilter]  = useState<string>(currentRole === 'DeptHead' ? 'Employee' : 'all')
  const [showModal,   setShowModal]   = useState(false)
  const [deleteUser,  setDeleteUser]  = useState<UserResponseModel | null>(null)
  const [editUser, setEditUser] = useState<UserResponseModel | null>(null)
  const [delLoading,  setDelLoading]  = useState(false)

  const canAdd    = ['SuperAdmin', 'HospitalAdmin', 'DeptHead'].includes(currentRole)
  const canDelete = (u: UserResponseModel) => {
    if (currentRole === 'SuperAdmin') return u.roleType !== 'SuperAdmin'
    if (currentRole === 'HospitalAdmin') return u.roleType === 'DeptHead' || u.roleType === 'Employee'
    if (currentRole === 'DeptHead') return u.roleType === 'Employee'
    return false
  }

  const canEdit = (u: UserResponseModel) => {
    if (currentRole === 'SuperAdmin') return u.roleType !== 'SuperAdmin'
    if (currentRole === 'HospitalAdmin') return u.roleType === 'DeptHead' || u.roleType === 'Employee'
    if (currentRole === 'DeptHead') return u.roleType === 'Employee'
    return false
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await userService.getAll()
      if (res.data.succedded) setUsers(res.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async () => {
    if (!deleteUser) return
    setDelLoading(true)
    try {
      await userService.deleteUser(deleteUser.id)
      setDeleteUser(null)
      fetchUsers()
    } finally {
      setDelLoading(false)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    
    if (roleFilter === 'inactive') return matchSearch && !u.isActive
    if (roleFilter === 'new') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return matchSearch && new Date(u.createdOn) >= weekAgo
    }
    
    const matchRole = roleFilter === 'all' || u.roleType === roleFilter
    return matchSearch && matchRole
  })

  const hospitalId = currentUser?.hospitalId as string | undefined

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Xodimlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Jami {users.length} ta xodim</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600
                       hover:from-cyan-400 hover:to-blue-500 text-white font-semibold
                       rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm"
          >
            <Icon d={IC.plus} className="w-4 h-4" />
            Yangi xodim
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
                placeholder="Ism yoki email orqali qidirish..."
                className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600
                        rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500
                        focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
            </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm
                     focus:outline-none focus:border-cyan-500 transition-all min-w-[160px]"
        >
          {currentRole === 'DeptHead' ? (
                <option value="Employee">Xodim</option>
            ) : currentRole === 'HospitalAdmin' ? (
                <>
                <option value="all">Barcha rollar</option>
                <option value="DeptHead">Bo'lim boshlig'i</option>
                <option value="Employee">Xodim</option>
                </>
            ) : (
                <>
                <option value="all">Barcha rollar</option>
                <option value="SuperAdmin">Super Admin</option>
                <option value="HospitalAdmin">Shifoxona Admin</option>
                <option value="DeptHead">Bo'lim boshlig'i</option>
                <option value="Employee">Xodim</option>
                </>
            )}
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
              <Icon d={IC.user} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Xodimlar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Xodim</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Email</th>
                    {currentRole === 'SuperAdmin' && (
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Shifoxona</th>
                    )}
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Telefon</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Rol</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(u => {
                    const rc = ROLE_CONFIG[u.roleType] ?? { label: u.roleType, color: 'text-slate-400', bg: 'bg-slate-700' }
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(u.fullName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {getInitials(u.fullName)}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{u.fullName}</p>
                              {u.specializationName && (
                                <p className="text-slate-500 text-xs">{u.specializationName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-400 text-sm">{u.email}</p>
                        </td>
                        {currentRole === 'SuperAdmin' && (
                          <td className="px-5 py-3.5">
                            <p className="text-slate-400 text-sm">{u.hospitalName ?? '—'}</p>
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          <p className="text-slate-400 text-sm">{u.phoneNumber ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap ${rc.bg} ${rc.color}`}>
                            {rc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                            {u.isActive ? 'Faol' : 'Nofaol'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {canEdit(u) && (
                              <button
                                onClick={() => setEditUser(u)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all"
                              >
                                <Icon d={IC.edit} className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete(u) && (
                              <button
                                onClick={() => setDeleteUser(u)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all"
                              >
                                <Icon d={IC.trash} className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map(u => {
                const rc = ROLE_CONFIG[u.roleType] ?? { label: u.roleType, color: 'text-slate-400', bg: 'bg-slate-700' }
                return (
                  <div key={u.id} className="px-4 py-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(u.fullName)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {getInitials(u.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium truncate">{u.fullName}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${rc.bg} ${rc.color}`}>
                          {rc.label}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{u.email}</p>
                      {u.phoneNumber && <p className="text-slate-500 text-xs">{u.phoneNumber}</p>}
                    </div>
                    {canDelete(u) && (
                        <button
                            onClick={() => setDeleteUser(u)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all flex-shrink-0"
                        >
                            <Icon d={IC.trash} className="w-4 h-4" />
                        </button>
                    )}
                    {canEdit(u) && (
                        <button
                            onClick={() => setEditUser(u)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all flex-shrink-0"
                        >
                            <Icon d={IC.edit} className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Register Modal */}
      <RegisterModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchUsers}
        currentRole={currentRole}
        currentHospitalId={hospitalId}
        currentDepartmentId={currentUser?.departmentId}
      />

      {/* Delete Modal */}
      <DeleteModal
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        loading={delLoading}
      />

      <EditUserModal
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={fetchUsers}
        currentRole={currentRole}
        currentHospitalId={hospitalId}
        currentDepartmentId={currentUser?.departmentId}
      />
    </div>
  )
}