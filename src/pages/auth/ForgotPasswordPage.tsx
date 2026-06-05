// ForgotPasswordPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userService } from '../../services'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await userService.forgotPassword({ email })
      if (!res.data.succedded) {
        setError(res.data.errors?.[0] || 'Xatolik yuz berdi')
        return
      }
      setSuccess(true)
      setTimeout(() => navigate('/reset-password'), 2000)
    } catch {
      setError('Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Parolni tiklash</h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Emailingizga vaqtinchalik parol yuboramiz
          </p>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-green-400 font-medium">✓ Emailga yuborildi!</p>
              <p className="text-slate-400 text-sm mt-1">Reset sahifasiga o'tmoqdasiz...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@misol.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                           disabled:opacity-50 text-white font-semibold rounded-xl py-3.5 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Yuborilmoqda...</span></> : 'Yuborish'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link to="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              ← Loginga qaytish
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage