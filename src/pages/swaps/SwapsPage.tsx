import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { shiftSwapService, shiftService } from '../../services'
import type { ShiftSwapResponseModel, ShiftResponseModel } from '../../types'
import { SwapStatus, ShiftStatus } from '../../types'

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  swap:    'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  plus:    'M12 4v16m8-8H4',
  close:   'M6 18L18 6M6 6l12 12',
  check:   'M5 13l4 4L19 7',
  x:       'M6 18L18 6M6 6l12 12',
  clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  calendar:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  assign:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  filter:  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

const fmtTime = (t: string) => t.substring(0, 5)

const fmtRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Hozirgina'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} soat oldin`
  return `${Math.floor(hrs / 24)} kun oldin`
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  [SwapStatus.Pending]:  { label: 'Kutilmoqda',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'    },
  [SwapStatus.Accepted]: { label: 'Qabul qilindi', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'      },
  [SwapStatus.Rejected]: { label: 'Rad etildi',    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'        },
  [SwapStatus.Approved]: { label: 'Tasdiqlandi',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30'},
}

// ── Request Swap Modal (Employee) ─────────────────────────────────────────────
function RequestSwapModal({
  open, onClose, onSuccess, userId,
}: {
  open: boolean; onClose: () => void; onSuccess: () => void; userId: string
}) {
  const [shifts,  setShifts]  = useState<ShiftResponseModel[]>([])
  const [shiftId, setShiftId] = useState('')
  const [reason,  setReason]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setShiftId(''); setReason(''); setError(''); setSuccess(false)
    shiftService.getByUser(userId).then(r => {
      if (r.data.succedded) {
        // Faqat rejalashtirilgan kelgusi smenalar
        const upcoming = (r.data.result ?? []).filter(
          s => s.status === ShiftStatus.Scheduled && new Date(s.shiftDate) >= new Date()
        )
        setShifts(upcoming)
      }
    })
  }, [open, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftId) { setError('Smena tanlang'); return }
    if (!reason.trim()) { setError('Sababni kiriting'); return }
    setLoading(true); setError('')
    try {
      const res = await shiftSwapService.requestSwap({ shiftId, reason: reason.trim() })
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi'); return }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
              <Icon d={IC.swap} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Smena almashuv so'rovi</h2>
              <p className="text-slate-500 text-xs">Smenangizni boshqa xodimga o'tkazing</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">So'rov yuborildi!</p>
              <p className="text-slate-500 text-sm text-center">Admin yoki bo'lim boshlig'i ko'rib chiqadi</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Smena tanlash */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Smena tanlang
                </label>
                {shifts.length === 0 ? (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-500 text-sm text-center">
                    Almashtirish mumkin bo'lgan smenalar yo'q
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {shifts.map(s => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          shiftId === s.id
                            ? 'bg-violet-500/10 border-violet-500/50'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shiftId"
                          value={s.id}
                          checked={shiftId === s.id}
                          onChange={() => setShiftId(s.id)}
                          className="accent-violet-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{fmtDate(s.shiftDate)}</p>
                          <p className="text-slate-500 text-xs">
                            {s.departmentName} · {fmtTime(s.startTime)} — {fmtTime(s.endTime)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Sabab */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Almashuv sababi
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Masalan: Kasal bo'lib qoldim, oilaviy sharoit..."
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500
                             focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium">
                  Bekor qilish
                </button>
                <button type="submit" disabled={loading || shifts.length === 0}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Yuborilmoqda...</span></>
                    : 'So\'rov yuborish'
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

// ── Detail / Action Modal (Admin & DeptHead) ──────────────────────────────────
function DetailModal({
  swap, role, onClose, onAction,
}: {
  swap: ShiftSwapResponseModel | null
  role: string
  onClose: () => void
  onAction: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (!swap) return null

  // SuperAdmin-ni ham qo'shamiz va shartni to'g'rilaymiz
const isAdminRole = role === 'HospitalAdmin' || role === 'DeptHead' || role === 'SuperAdmin';

// Admin ham Accepted (xodim rozi bo'lgan), ham Pending (hali hech kim olmagan) so'rovni tasdiqlay olsin
const canApprove = isAdminRole && (swap.status === SwapStatus.Accepted || swap.status === SwapStatus.Pending);
const canReject = isAdminRole && (swap.status === SwapStatus.Pending || swap.status === SwapStatus.Accepted);
  // const canApprove = (role === 'HospitalAdmin' || role === 'DeptHead') && swap.status === SwapStatus.Accepted
  const canAssign  = (role === 'HospitalAdmin' || role === 'DeptHead') && swap.status === SwapStatus.Pending
  const st = STATUS_CFG[swap.status] ?? { label: '', color: '', bg: '' }

  const handleApprove = async () => {
    setLoading(true); setError('')
    try {
      const res = await shiftSwapService.approveSwap(swap.id)
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik'); return }
      onAction(); onClose()
    } catch { setError('Serverga ulanishda xatolik') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-base">So'rov tafsiloti</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Holat</span>
            <span className={`text-xs px-3 py-1 rounded-lg border font-medium ${st.bg} ${st.color}`}>{st.label}</span>
          </div>

          {/* Info rows */}
          {[
            { label: "So'rov beruvchi", value: swap.requesterFullName, icon: IC.user },
            { label: 'Smena sanasi',    value: fmtDate(swap.shiftDate),  icon: IC.calendar },
            { label: 'Muddati',         value: fmtDate(swap.deadline),   icon: IC.clock },
            { label: "Qabul qiluvchi",  value: swap.acceptorFullName ?? '—', icon: IC.assign },
            { label: 'Tasdiqlagan',     value: swap.approverFullName ?? '—', icon: IC.check },
          ].map(row => (
            <div key={row.label} className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
              <div className="text-slate-500 mt-0.5"><Icon d={row.icon} className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-xs">{row.label}</p>
                <p className="text-white text-sm font-medium">{row.value}</p>
              </div>
            </div>
          ))}

          {/* Sabab */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
            <p className="text-slate-500 text-xs mb-1">Sabab</p>
            <p className="text-white text-sm">{swap.reason}</p>
          </div>

          {/* Admin actions */}
          {(canApprove || canReject) && (
  <div className="flex gap-3 pt-2">
    {canReject && (
      <button
        onClick={async () => {
          // Agar backendda alohida Reject API bo'lmasa, vaqtinchalik mantiq yoki API-ga moslang
          alert("Rad etish funksiyasi backendda tekshirilishi kerak");
        }}
        disabled={loading}
        className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm"
      >
        <Icon d={IC.x} className="w-4 h-4" />
        Rad etish
      </button>
    )}

    {canApprove && (
      <button
        onClick={handleApprove}
        disabled={loading}
        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Icon d={IC.check} className="w-4 h-4" />
            Tasdiqlash
          </>
        )}
      </button>
    )}
  </div>
)}

          {canAssign && (
            <div className="bg-slate-800/60 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
              <Icon d={IC.info} className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">Xodim qabul qilishini kutilmoqda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Accept Swap Modal (Employee sees pending swaps to accept) ─────────────────
function AcceptModal({
  swap, onClose, onAction,
}: {
  swap: ShiftSwapResponseModel | null; onClose: () => void; onAction: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  if (!swap) return null

  const handleAccept = async () => {
    setLoading(true); setError('')
    try {
      const res = await shiftSwapService.acceptSwap(swap.id)
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik'); return }
      setSuccess(true)
      setTimeout(() => { onAction(); onClose() }, 1500)
    } catch { setError('Serverga ulanishda xatolik') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-base">Almashuvni qabul qilish</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Icon d={IC.check} className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Qabul qilindi!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Xodim</span>
                  <span className="text-white font-medium">{swap.requesterFullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Smena sanasi</span>
                  <span className="text-white font-medium">{fmtDate(swap.shiftDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sabab</span>
                  <span className="text-white font-medium max-w-[180px] text-right truncate">{swap.reason}</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm text-center">
                Ushbu smenani o'z zimmangizga olasizmi?
              </p>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium">
                  Yo'q
                </button>
                <button onClick={handleAccept} disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Ha, qabul qilaman'
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Swap Card ─────────────────────────────────────────────────────────────────
function SwapCard({
  swap, role, userId, onDetail, onAccept,
}: {
  swap: ShiftSwapResponseModel
  role: string
  userId: string
  onDetail: (s: ShiftSwapResponseModel) => void
  onAccept: (s: ShiftSwapResponseModel) => void
}) {
  const st = STATUS_CFG[swap.status] ?? { label: '', color: '', bg: '' }
  const isRequester  = swap.requesterId === userId
  const canAccept    = role === 'Employee' && !isRequester && swap.status === SwapStatus.Pending
  const isAdmin      = role === 'HospitalAdmin' || role === 'DeptHead' || role === 'SuperAdmin'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Icon d={IC.swap} className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{swap.requesterFullName}</p>
            <p className="text-slate-500 text-xs">{fmtRelative(swap.createdOn)}</p>
          </div>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex-shrink-0 ${st.bg} ${st.color}`}>
          {st.label}
        </span>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800/60 rounded-xl px-3 py-2">
          <p className="text-slate-500 text-[10px] mb-0.5">Smena sanasi</p>
          <p className="text-white text-xs font-medium">{fmtDate(swap.shiftDate)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-3 py-2">
          <p className="text-slate-500 text-[10px] mb-0.5">Muddat</p>
          <p className="text-white text-xs font-medium">{fmtDate(swap.deadline)}</p>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-slate-800/40 rounded-xl px-3 py-2 mb-3">
        <p className="text-slate-500 text-[10px] mb-0.5">Sabab</p>
        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{swap.reason}</p>
      </div>

      {/* Acceptor / approver */}
      {swap.acceptorFullName && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Icon d={IC.user} className="w-3 h-3" />
          </div>
          <p className="text-slate-400 text-xs">
            Qabul qildi: <span className="text-blue-300 font-medium">{swap.acceptorFullName}</span>
          </p>
        </div>
      )}
      {swap.approverFullName && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Icon d={IC.check} className="w-3 h-3" />
          </div>
          <p className="text-slate-400 text-xs">
            Tasdiqladi: <span className="text-emerald-300 font-medium">{swap.approverFullName}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canAccept && (
          <button
            onClick={() => onAccept(swap)}
            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400
                       text-xs font-medium px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Icon d={IC.check} className="w-3.5 h-3.5" />
            Qabul qilish
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onDetail(swap)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300
                       text-xs font-medium px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Icon d={IC.info} className="w-3.5 h-3.5" />
            Batafsil
          </button>
        )}
        {!canAccept && !isAdmin && (
          <div className={`flex-1 text-center text-xs py-2 rounded-lg border font-medium ${st.bg} ${st.color}`}>
            {isRequester ? "Sizning so'rovingiz" : st.label}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SwapsPage() {
  const { user } = useAuth()
  const role   = user?.roleType ?? 'Employee'
  const userId = user?.id ?? ''

  const [swaps,       setSwaps]       = useState<ShiftSwapResponseModel[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<'all' | 'pending' | 'accepted' | 'approved' | 'rejected'>('all')
  const [requestOpen, setRequestOpen] = useState(false)
  const [detailSwap,  setDetailSwap]  = useState<ShiftSwapResponseModel | null>(null)
  const [acceptSwap,  setAcceptSwap]  = useState<ShiftSwapResponseModel | null>(null)

  const isAdmin    = role === 'HospitalAdmin' || role === 'DeptHead' || role === 'SuperAdmin'
  const isEmployee = role === 'Employee' 
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = isAdmin
        ? await shiftSwapService.getPending()
        : await shiftSwapService.getByUser(userId)

      // Admin uchun: pending + getByUser qo'shib barcha ko'rsatamiz
      if (isAdmin) {
        const [pendingRes, userRes] = await Promise.allSettled([
          shiftSwapService.getPending(),
          shiftSwapService.getByUser(userId),
        ])
        const pending = (pendingRes.status === 'fulfilled' && pendingRes.value.data.succedded)
          ? pendingRes.value.data.result ?? [] : []
        const mine    = (userRes.status === 'fulfilled' && userRes.value.data.succedded)
          ? userRes.value.data.result ?? [] : []

        // Dublikatlarni olib tashlash
        const map = new Map<string, ShiftSwapResponseModel>()
        ;[...pending, ...mine].forEach(s => map.set(s.id, s))
        setSwaps(Array.from(map.values()).sort(
          (a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
        ))
      } else {
        if (res.data.succedded) {
          setSwaps((res.data.result ?? []).sort(
            (a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
          ))
        }
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [userId])

  // Filter
  const filtered = swaps.filter(s => {
    if (filter === 'all')      return true
    if (filter === 'pending')  return s.status === SwapStatus.Pending
    if (filter === 'accepted') return s.status === SwapStatus.Accepted
    if (filter === 'approved') return s.status === SwapStatus.Approved
    if (filter === 'rejected') return s.status === SwapStatus.Rejected
    return true
  })

  // Stats
  const pendingCount  = swaps.filter(s => s.status === SwapStatus.Pending).length
  const acceptedCount = swaps.filter(s => s.status === SwapStatus.Accepted).length
  const approvedCount = swaps.filter(s => s.status === SwapStatus.Approved).length
  const rejectedCount = swaps.filter(s => s.status === SwapStatus.Rejected).length

  const FILTERS = [
    { key: 'all',      label: 'Barchasi',       count: swaps.length  },
    { key: 'pending',  label: 'Kutilmoqda',      count: pendingCount  },
    { key: 'accepted', label: 'Qabul qilingan',  count: acceptedCount },
    { key: 'approved', label: 'Tasdiqlangan',    count: approvedCount },
    { key: 'rejected', label: 'Rad etilgan',     count: rejectedCount },
  ] as const

  return (
    <div className="p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Smena almashuv</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? "Xodimlarning almashuv so'rovlarini boshqaring" : "Smena almashuv so'rovlaringiz"}
          </p>
        </div>
        {isEmployee && (
          <button
            onClick={() => setRequestOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold
                       px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            <Icon d={IC.plus} className="w-4 h-4" />
            <span className="hidden sm:inline">So'rov yuborish</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami so\'rovlar', value: swaps.length,  color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20'   },
          { label: 'Kutilmoqda',      value: pendingCount,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'     },
          { label: 'Tasdiqlangan',    value: approvedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Rad etilgan',     value: rejectedCount, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'         },
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

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f.key ? 'bg-white/20' : 'bg-slate-700'
              }`}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Icon d={IC.swap} className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">So'rovlar yo'q</p>
            <p className="text-slate-500 text-sm mt-1">
              {filter === 'all'
                ? isEmployee ? "Hali smena almashuv so'rovi yubormadingiz" : "Hech qanday so'rov yo'q"
                : "Bu holatda so'rovlar topilmadi"}
            </p>
          </div>
          {isEmployee && filter === 'all' && (
            <button
              onClick={() => setRequestOpen(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              <Icon d={IC.plus} className="w-4 h-4" />
              So'rov yuborish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(swap => (
            <SwapCard
              key={swap.id}
              swap={swap}
              role={role}
              userId={userId}
              onDetail={setDetailSwap}
              onAccept={setAcceptSwap}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RequestSwapModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSuccess={fetchData}
        userId={userId}
      />
      <DetailModal
        swap={detailSwap}
        role={role}
        onClose={() => setDetailSwap(null)}
        onAction={fetchData}
      />
      <AcceptModal
        swap={acceptSwap}
        onClose={() => setAcceptSwap(null)}
        onAction={fetchData}
      />
    </div>
  )
}