import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services'

export default function OtpPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) return setError('6 xonali kodni kiriting')

    setLoading(true)
    setError('')
    try {
      const res = await userService.verifyOtp(code, userId!)
      const data = res.data
      if (!data.succedded) {
        setError(data.errors?.[0] || 'Kod xato yoki muddati o\'tgan')
        return
      }
      const { accessToken, refreshToken, id, mustChangePassword } = data.result
      login(accessToken, refreshToken, id, mustChangePassword)
      navigate(mustChangePassword ? '/change-password' : '/dashboard')
    } catch {
      setError('Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await userService.resendOtp(userId!)
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Qayta yuborishda xatolik')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Email tasdiqlash</h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Emailingizga yuborilgan 6 xonali kodni kiriting
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* OTP inputs */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border
                    bg-slate-800 text-white transition-all duration-200
                    focus:outline-none focus:ring-2
                    ${digit
                      ? 'border-cyan-500 focus:ring-cyan-500/50'
                      : 'border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600
                         hover:from-cyan-400 hover:to-blue-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         text-white font-semibold rounded-xl py-3.5
                         transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : 'Tasdiqlash'}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            {countdown > 0 ? (
              <p className="text-slate-500 text-sm">
                Qayta yuborish: <span className="text-cyan-400 font-mono">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {resending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/login')}
            className="mt-4 w-full text-slate-500 hover:text-slate-300 text-sm text-center transition-colors"
          >
            ← Loginga qaytish
          </button>
        </div>
      </div>
    </div>
  )
}