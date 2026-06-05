import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services'

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  email:   'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:   'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  badge:   'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  hospital:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  dept:    'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  eye:     'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  eyeOff:  'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
  check:   'M5 13l4 4L19 7',
  edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SuperAdmin:    { label: 'Super Admin',      color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  HospitalAdmin: { label: 'Shifoxona Admin',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/30'   },
  DeptHead:      { label: "Bo'lim boshlig'i", color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'   },
  Employee:      { label: 'Xodim',            color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/30'},
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({
  label, value, icon, onChange, type = 'text', placeholder, readOnly = false,
}: {
  label: string
  value: string
  icon: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Icon d={icon} className="w-4 h-4" />
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm transition-all
            ${readOnly
              ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'
            }`}
        />
      </div>
    </div>
  )
}

// ── Password field ────────────────────────────────────────────────────────────
function PasswordField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Icon d={IC.lock} className="w-4 h-4" />
        </div>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                     rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-cyan-500
                     focus:ring-1 focus:ring-cyan-500/50 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Icon d={show ? IC.eyeOff : IC.eye} className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm
      ${type === 'success'
        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'
      }`}
    >
      {type === 'success'
        ? <Icon d={IC.check} className="w-4 h-4 flex-shrink-0" />
        : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" /></svg>
      }
      {message}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  // Personal info
  const [fullName,   setFullName]   = useState('')
  const [phoneNumber,setPhoneNumber]= useState('')
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password
  const [oldPass,    setOldPass]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [confirmPass,setConfirmPass]= useState('')
  const [changing,   setChanging]   = useState(false)
  const [passMsg,    setPassMsg]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '')
      setPhoneNumber(user.phoneNumber ?? '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { setSaveMsg({ type: 'error', text: "Ism bo'sh bo'lmasligi kerak" }); return }
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await userService.updateProfile({ fullName, phoneNumber })
      if (res.data.succedded) {
        setSaveMsg({ type: 'success', text: "Ma'lumotlar saqlandi" })
        await refreshUser()
      } else {
        setSaveMsg({ type: 'error', text: res.data.errors?.[0] ?? 'Xatolik yuz berdi' })
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Serverga ulanishda xatolik' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPass) { setPassMsg({ type: 'error', text: 'Joriy parolni kiriting' }); return }
    if (!newPass) { setPassMsg({ type: 'error', text: 'Yangi parolni kiriting' }); return }
    if (newPass !== confirmPass) { setPassMsg({ type: 'error', text: 'Yangi parollar mos kelmaydi' }); return }
    if (newPass.length < 8) { setPassMsg({ type: 'error', text: 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak' }); return }

    setChanging(true)
    setPassMsg(null)
    try {
      const res = await userService.changePassword({ oldPassword: oldPass, newPassword: newPass })
      if (res.data?.succedded === false) {
        setPassMsg({ type: 'error', text: res.data.errors?.[0] ?? 'Xatolik yuz berdi' })
      } else {
        setPassMsg({ type: 'success', text: 'Parol muvaffaqiyatli o\'zgartirildi' })
        setOldPass(''); setNewPass(''); setConfirmPass('')
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik' })
    } finally {
      setChanging(false)
      setTimeout(() => setPassMsg(null), 4000)
    }
  }

  if (!user) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const rc = ROLE_CONFIG[user.roleType] ?? { label: user.roleType, color: 'text-slate-400', bg: 'bg-slate-700 border-slate-600' }
  const initials = getInitials(user.fullName ?? 'U')

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white font-bold text-xl">Profil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Shaxsiy ma'lumotlaringizni boshqaring</p>
      </div>

      {/* Avatar + role banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-cyan-500/20">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg truncate">{user.fullName}</h2>
          <p className="text-slate-400 text-sm truncate">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${rc.bg} ${rc.color}`}>
              {rc.label}
            </span>
            {user.specializationName && (
              <span className="text-xs px-2.5 py-1 rounded-lg border bg-slate-700/50 border-slate-600 text-slate-300">
                {user.specializationName}
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              Faol
            </span>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Personal info card ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Icon d={IC.edit} className="w-4 h-4" />
            </div>
            <h3 className="text-white font-semibold text-sm">Shaxsiy ma'lumotlar</h3>
          </div>

          <div className="p-5 space-y-4">
            {/* Read-only info */}
            <div className="grid grid-cols-1 gap-3">
              <Field label="Email" value={user.email} icon={IC.email} readOnly />
              {user.hospitalName && (
                <Field label="Shifoxona" value={user.hospitalName} icon={IC.hospital} readOnly />
              )}
              {user.departmentName && (
                <Field label="Bo'lim" value={user.departmentName} icon={IC.dept} readOnly />
              )}
            </div>

            <div className="h-px bg-slate-800" />

            {/* Editable fields */}
            <Field
              label="To'liq ism *"
              value={fullName}
              icon={IC.user}
              onChange={setFullName}
              placeholder="Ism Familiya"
            />
            <Field
              label="Telefon raqami"
              value={phoneNumber}
              icon={IC.phone}
              onChange={setPhoneNumber}
              placeholder="+998901234567"
            />

            {saveMsg && <Alert type={saveMsg.type} message={saveMsg.text} />}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                         disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all
                         flex items-center justify-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saqlanmoqda...</span></>
                : 'Saqlash'
              }
            </button>
          </div>
        </div>

        {/* ── Change password card ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Icon d={IC.lock} className="w-4 h-4" />
            </div>
            <h3 className="text-white font-semibold text-sm">Parolni o'zgartirish</h3>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-slate-500 text-xs">
              Xavfsizlik uchun kamida 8 ta belgi, katta va kichik harf, raqam va maxsus belgi ishlatish tavsiya etiladi.
            </p>

            <PasswordField
              label="Joriy parol"
              value={oldPass}
              onChange={setOldPass}
            />
            <PasswordField
              label="Yangi parol"
              value={newPass}
              onChange={setNewPass}
              placeholder="Kamida 8 ta belgi"
            />
            <PasswordField
              label="Yangi parolni tasdiqlash"
              value={confirmPass}
              onChange={setConfirmPass}
            />

            {/* Password strength indicator */}
            {newPass && (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500">Parol kuchi:</p>
                <div className="flex gap-1">
                  {[
                    newPass.length >= 8,
                    /[A-Z]/.test(newPass),
                    /[a-z]/.test(newPass),
                    /[0-9]/.test(newPass),
                    /[^a-zA-Z0-9]/.test(newPass),
                  ].map((ok, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${ok ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className="text-[10px] text-slate-600">
                  Uzunlik · Katta harf · Kichik harf · Raqam · Maxsus belgi
                </p>
              </div>
            )}

            {passMsg && <Alert type={passMsg.type} message={passMsg.text} />}

            <button
              onClick={handleChangePassword}
              disabled={changing}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500
                         disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all
                         flex items-center justify-center gap-2"
            >
              {changing
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>O'zgartirilmoqda...</span></>
                : "Parolni o'zgartirish"
              }
            </button>
          </div>
        </div>

      </div>

      {/* Extra info card — role details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mt-5">
        <h3 className="text-white font-semibold text-sm mb-4">Tizim ma'lumotlari</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Rol</p>
            <p className={`text-sm font-semibold ${rc.color}`}>{rc.label}</p>
          </div>
          {user.hospitalName && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Shifoxona</p>
              <p className="text-white text-sm font-semibold truncate">{user.hospitalName}</p>
            </div>
          )}
          {user.departmentName && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Bo'lim</p>
              <p className="text-white text-sm font-semibold truncate">{user.departmentName}</p>
            </div>
          )}
          {user.specializationName && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Mutaxassislik</p>
              <p className="text-white text-sm font-semibold truncate">{user.specializationName}</p>
            </div>
          )}
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Ro'yxatdan o'tgan</p>
            <p className="text-white text-sm font-semibold">
              {(() => {
                    const d = new Date(user.createdOn)
                    const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
                    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`
                })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}