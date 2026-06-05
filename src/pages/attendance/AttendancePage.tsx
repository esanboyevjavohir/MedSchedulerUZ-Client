import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { attendanceService, shiftService } from '../../services'
import type { AttendanceResponseModel, ShiftResponseModel } from '../../types'
import { AttendanceStatus, ShiftStatus } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check:    'M5 13l4 4L19 7',
  login:    'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  qr:       'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
  close:    'M6 18L18 6M6 6l12 12',
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

const fmtDuration = (clockIn: string, clockOut?: string) => {
  const start = new Date(clockIn).getTime()
  const end   = clockOut ? new Date(clockOut).getTime() : Date.now()
  const mins  = Math.floor((end - start) / 60000)
  const h     = Math.floor(mins / 60)
  const m     = mins % 60
  return h > 0 ? `${h}s ${m}d` : `${m}d`
}

const STATUS_CONFIG = {
  [AttendanceStatus.Present]:    { label: "O'z vaqtida", color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  [AttendanceStatus.Late]:       { label: 'Kechikdi',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'     },
  [AttendanceStatus.Absent]:     { label: 'Kelmadi',     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'         },
  [AttendanceStatus.EarlyLeave]: { label: 'Erta ketdi',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'       },
}

// ── ClockOut Modal ─────────────────────────────────────────────────────────────
function ClockOutModal({ shift, onClose, onSuccess }: {
  shift: ShiftResponseModel | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [qrToken, setQrToken] = useState('')

  useEffect(() => {
    if (!shift) return
    setError(''); setSuccess(false); setQrToken('')
    // Shift qrToken ni olish
    shiftService.getQrToken(shift.id).then(r => {
      if (r.data.succedded && r.data.result) setQrToken(r.data.result)
    }).catch(() => {})
  }, [shift?.id])

  const handleClockOut = async () => {
    if (!shift || !qrToken) { setError("QR token topilmadi"); return }
    setLoading(true); setError('')
    try {
      const res = await attendanceService.clockOut({ shiftId: shift.id, qrToken })
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik'); return }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (!shift) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Icon d={IC.logout} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Chiqish belgilash</h2>
              <p className="text-slate-500 text-xs">{shift.departmentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-semibold text-lg">Chiqish belgilandi!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 flex justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Smena</p>
                  <p className="text-white text-sm font-medium">{fmtDate(shift.shiftDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Vaqt</p>
                  <p className="text-white text-sm font-medium">{shift.startTime.substring(0,5)} — {shift.endTime.substring(0,5)}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <p className="text-slate-400 text-sm text-center">Smenani yakunlashni tasdiqlaysizmi?</p>

              <button onClick={handleClockOut} disabled={loading || !qrToken}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Icon d={IC.logout} className="w-4 h-4" />Chiqishni tasdiqlash</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuth()
  const role   = user?.roleType ?? 'Employee'
  const userId = user?.id ?? ''

  const [attendances,   setAttendances]   = useState<AttendanceResponseModel[]>([])
  const [myShifts,      setMyShifts]      = useState<ShiftResponseModel[]>([])
  const [loading,       setLoading]       = useState(true)
  const [clockOutShift, setClockOutShift] = useState<ShiftResponseModel | null>(null)
  const [tab,           setTab]           = useState<'today' | 'all'>('today')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [attRes, shiftRes] = await Promise.allSettled([
        attendanceService.getByUser(userId),
        shiftService.getByUser(userId),
      ])
      if (attRes.status   === 'fulfilled' && attRes.value.data.succedded)   setAttendances(attRes.value.data.result ?? [])
      if (shiftRes.status === 'fulfilled' && shiftRes.value.data.succedded) setMyShifts(shiftRes.value.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [userId])

  const today = new Date().toDateString()

  const todayShifts = myShifts.filter(s =>
    new Date(s.shiftDate).toDateString() === today &&
    (s.status === ShiftStatus.Scheduled || s.status === ShiftStatus.Completed)
  )

  const todayAttendances = attendances.filter(a =>
    new Date(a.clockIn ?? a.createdOn).toDateString() === today
  )

  const getAttendanceForShift = (shiftId: string) =>
    attendances.find(a => a.shiftId === shiftId)

  const filteredAttendances = tab === 'today' ? todayAttendances : attendances

  const present    = attendances.filter(a => a.status === AttendanceStatus.Present).length
  const late       = attendances.filter(a => a.status === AttendanceStatus.Late).length
  const earlyLeave = attendances.filter(a => a.status === AttendanceStatus.EarlyLeave).length

  const isEmployee = role === 'Employee' || role === 'DeptHead'

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-white font-bold text-xl">Davomat</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami qayd',   value: attendances.length, color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20'       },
          { label: "O'z vaqtida", value: present,            color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Kechikkan',   value: late,               color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
          { label: 'Erta ketgan', value: earlyLeave,         color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'       },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            {loading
              ? <div className="w-10 h-8 bg-slate-700 rounded-lg animate-pulse mb-1" />
              : <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            }
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bugungi smenalar */}
      {isEmployee && todayShifts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-white font-semibold text-sm mb-3">Bugungi smenalarim</h2>
          <div className="space-y-3">
            {todayShifts.map(shift => {
              const att           = getAttendanceForShift(shift.id)
              const hasClockedIn  = !!att?.clockIn
              const hasClockedOut = !!att?.clockOut
              const st            = att ? STATUS_CONFIG[att.status] : null

              return (
                <div key={shift.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Icon d={IC.clock} className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{shift.departmentName}</p>
                        <p className="text-slate-500 text-xs">{shift.startTime.substring(0,5)} — {shift.endTime.substring(0,5)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {hasClockedIn && st && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      )}
                      {hasClockedIn && (
                        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                          Kirdi: {fmtTime(att!.clockIn!)}
                        </span>
                      )}
                      {hasClockedOut && (
                        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                          Chiqdi: {fmtTime(att!.clockOut!)}
                        </span>
                      )}
                      {hasClockedIn && (
                        <span className="text-xs text-slate-500 bg-slate-800/50 px-2.5 py-1 rounded-lg">
                          {fmtDuration(att!.clockIn!, att?.clockOut ?? undefined)}
                        </span>
                      )}

                      {/* Kirish — QR orqali, yo'riqnoma */}
                      {!hasClockedIn && (
                        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs px-3 py-1.5 rounded-lg">
                          <Icon d={IC.qr} className="w-3.5 h-3.5" />
                          QR orqali kiring
                        </div>
                      )}

                      {/* Chiqish — tugma bilan */}
                      {hasClockedIn && !hasClockedOut && (
                        <button
                          onClick={() => setClockOutShift(shift)}
                          className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Icon d={IC.logout} className="w-3.5 h-3.5" />
                          Chiqish
                        </button>
                      )}

                      {hasClockedOut && (
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                          ✓ Yakunlandi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* QR yo'riqnoma */}
          <div className="mt-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <Icon d={IC.qr} className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-cyan-300 text-xs leading-relaxed">
              Ishga kirish uchun admin ko'rsatgan QR kodni telefon kamera ilovasida skanerlang.
              Chiqish uchun esa sahifadagi <strong>"Chiqish"</strong> tugmasini bosing.
            </p>
          </div>
        </div>
      )}

      {/* Tarix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-800">
          {([['today', 'Bugun'], ['all', 'Barcha']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === key ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Icon d={IC.calendar} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Davomat ma'lumotlari yo'q</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Sana</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Xodim</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Kirdi</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Chiqdi</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Davomiylik</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAttendances.map(a => {
                    const sc = STATUS_CONFIG[a.status] ?? { label: '', color: '', bg: '' }
                    return (
                      <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5"><p className="text-white text-sm">{fmtDate(a.clockIn ?? a.createdOn)}</p></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white text-[10px] font-bold">
                              {(a.userFullName ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <p className="text-white text-sm">{a.userFullName ?? '—'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><p className="text-slate-400 text-sm">{a.clockIn ? fmtTime(a.clockIn) : '—'}</p></td>
                        <td className="px-5 py-3.5"><p className="text-slate-400 text-sm">{a.clockOut ? fmtTime(a.clockOut) : '—'}</p></td>
                        <td className="px-5 py-3.5"><p className="text-slate-400 text-sm">{a.clockIn ? fmtDuration(a.clockIn, a.clockOut ?? undefined) : '—'}</p></td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filteredAttendances.map(a => {
                const sc = STATUS_CONFIG[a.status] ?? { label: '', color: '', bg: '' }
                return (
                  <div key={a.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-white text-sm font-medium">{a.userFullName ?? '—'}</p>
                        <p className="text-slate-500 text-xs">{fmtDate(a.clockIn ?? a.createdOn)}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium flex-shrink-0 ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500">
                      {a.clockIn  && <span>Kirdi: <span className="text-white">{fmtTime(a.clockIn)}</span></span>}
                      {a.clockOut && <span>Chiqdi: <span className="text-white">{fmtTime(a.clockOut)}</span></span>}
                      {a.clockIn  && <span>{fmtDuration(a.clockIn, a.clockOut ?? undefined)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <ClockOutModal
        shift={clockOutShift}
        onClose={() => setClockOutShift(null)}
        onSuccess={fetchData}
      />
    </div>
  )
}