import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { attendanceService } from '../../services'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  check: 'M5 13l4 4L19 7',
  error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

type State = 'loading' | 'success' | 'error' | 'already'

export default function ClockInPage() {
  const [params] = useSearchParams()
  const shiftId  = params.get('shiftId') ?? ''
  const token    = params.get('token') ?? ''

  const [state,   setState]   = useState<State>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!shiftId || !token) {
      setState('error')
      setMessage("URL noto'g'ri — shiftId yoki token yo'q")
      return
    }

    attendanceService.clockIn({ shiftId, qrToken: token })
      .then(res => {
        if (res.data.succedded) {
          setState('success')
          setMessage('Kirish muvaffaqiyatli belgilandi!')
        } else {
          const err = res.data.errors?.[0] ?? 'Xatolik yuz berdi'
          if (err.includes('allaqachon')) {
            setState('already')
            setMessage(err)
          } else {
            setState('error')
            setMessage(err)
          }
        }
      })
      .catch(err => {
        const msg = err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik'
        if (msg.includes('allaqachon')) {
          setState('already')
          setMessage(msg)
        } else {
          setState('error')
          setMessage(msg)
        }
      })
  }, [shiftId, token])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
            </svg>
          </div>
          <span className="font-bold text-white text-[15px]">
            Med<span className="text-cyan-500">Scheduler</span>
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-10 flex flex-col items-center gap-5">
          {state === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Tekshirilmoqda...</p>
                <p className="text-slate-500 text-sm mt-1">Iltimos kuting</p>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-emerald-400 font-bold text-xl">Kirish belgilandi!</p>
                <p className="text-slate-400 text-sm mt-2">{message}</p>
              </div>
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
                <p className="text-emerald-400 text-sm font-medium">
                  ✓ Davomat muvaffaqiyatli qayd etildi
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </>
          )}

          {state === 'already' && (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Icon d={IC.clock} className="w-10 h-10 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-amber-400 font-bold text-xl">Allaqachon belgilangan</p>
                <p className="text-slate-400 text-sm mt-2">{message}</p>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <Icon d={IC.error} className="w-10 h-10 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-red-400 font-bold text-xl">Xatolik!</p>
                <p className="text-slate-400 text-sm mt-2">{message}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}