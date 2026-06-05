import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await userService.login({ email, password })
      const data = res.data

      if (!data.succedded) {
        setError(data.errors?.[0] || 'Login yoki parol xato')
        return
      }

      const { accessToken, refreshToken, id, mustChangePassword } = data.result

      // OTP tasdiqlash kerak — userId bilan OTP sahifasiga yo'naltir
      if (!accessToken) {
        navigate(`/otp/${id}`)
        return
      }

      login(accessToken, refreshToken, id, mustChangePassword)

      if (mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0]
      setError(msg || 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-16">

        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            MedScheduler<span className="text-cyan-400">UZ</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm mx-auto">
            Tibbiyot muassasalari uchun zamonaviy navbat va jadval boshqaruv tizimi
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: '4', label: 'Rol turi' },
              { value: '∞', label: 'Shift boshqaruv' },
              { value: '24/7', label: 'Ishlash vaqti' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-2xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl">MedScheduler<span className="text-cyan-400">UZ</span></span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Xush kelibsiz</h2>
          <p className="text-slate-400 mb-8">Hisobingizga kiring</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@misol.com"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl pl-12 pr-4 py-3.5 text-sm
                             focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Parol</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl pl-12 pr-12 py-3.5 text-sm
                             focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                             transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link to="/forgot-password"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                Parolni unutdingizmi?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600
                         hover:from-cyan-400 hover:to-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold rounded-xl py-3.5
                         transition-all duration-200 shadow-lg shadow-cyan-500/20
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Kirish...</span>
                </>
              ) : (
                <span>Kirish</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}