import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services'

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [show, setShow] = useState({ oldPassword: false, newPassword: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key: keyof typeof show) =>
    setShow(prev => ({ ...prev, [key]: !prev[key] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) {
      setError('Yangi parollar mos kelmaydi')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await userService.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      })

      // Backend { message: "..." } qaytaradi — succedded yo'q
      // Xatolik bo'lmasa muvaffaqiyatli deb hisoblaymiz
      if (res.data?.succedded === false) {
        setError(res.data.errors?.[0] || 'Xatolik yuz berdi')
        return
      }

      logout()
      navigate('/login')
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0]
      setError(msg || 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'oldPassword' as const, label: 'Joriy parol' },
    { key: 'newPassword' as const, label: 'Yangi parol' },
    { key: 'confirm' as const, label: 'Yangi parolni tasdiqlash' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Warning banner */}
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-8">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-amber-400 font-medium text-sm">Parolni o'zgartirish talab etiladi</p>
              <p className="text-slate-400 text-xs mt-0.5">Davom etish uchun yangi parol o'rnating</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-8">Parolni o'zgartirish</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-400 mb-2">{f.label}</label>
                <div className="relative">
                  <input
                    type={show[f.key] ? 'text' : 'password'}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                               rounded-xl px-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-cyan-500
                               focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => toggle(f.key)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <EyeIcon show={show[f.key]} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                         disabled:opacity-50 text-white font-semibold rounded-xl py-3.5 transition-all
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saqlanmoqda...</span></>
              ) : 'Saqlash va kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}