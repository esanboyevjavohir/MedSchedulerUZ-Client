import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { UsersIcon } from '../../components/UsersIcon'
import {
  hospitalService,
  userService,
  shiftService,
  leaveRequestService,
  shiftSwapService,
  notificationService,
} from '../../services'
import type {
  HospitalResponseModel,
  UserResponseModel,
  ShiftResponseModel,
  LeaveRequestResponseModel,
  ShiftSwapResponseModel,
  NotificationResponseModel,
} from '../../types'
import { ShiftStatus, LeaveStatus, SwapStatus, ShiftType, NotificationType } from '../../types'

// ─── SVG Icon ────────────────────────────────────────────────────────────────
function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={`${className} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  )
}

const ICONS = {
  hospitals:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  shifts:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  leave:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  swap:       'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  bell:       'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  schedule:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  check:      'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  arrow:      'M13 7l5 5m0 0l-5 5m5-5H6',
  spinner:    'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
  attend:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  inactive: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, loading, onClick,
}: {
  label: string
  value: string | number
  icon: string | React.ReactNode
  color: 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber'
  loading?: boolean
  onClick?: () => void
}) {
  const colors = {
    cyan:    { bg: 'from-cyan-500/20 to-cyan-500/5',    border: 'border-cyan-500/25',    icon: 'text-cyan-400',    val: 'text-cyan-400'    },
    blue:    { bg: 'from-blue-500/20 to-blue-500/5',    border: 'border-blue-500/25',    icon: 'text-blue-400',    val: 'text-blue-400'    },
    violet:  { bg: 'from-violet-500/20 to-violet-500/5',border: 'border-violet-500/25',  icon: 'text-violet-400',  val: 'text-violet-400'  },
    emerald: { bg: 'from-emerald-500/20 to-emerald-500/5',border:'border-emerald-500/25',icon: 'text-emerald-400', val: 'text-emerald-400' },
    amber:   { bg: 'from-amber-500/20 to-amber-500/5',  border: 'border-amber-500/25',   icon: 'text-amber-400',   val: 'text-amber-400'   },
  }
  const c = colors[color]

  return (
    <div
      onClick={onClick}
      className={[
        `bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5`,
        'flex items-center gap-4',
        onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-200' : '',
      ].join(' ')}
    >
      <div className={`w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        {typeof icon === 'string'
          ? <Icon path={icon} className="w-6 h-6" />
          : icon
        }
      </div>
      <div>
        <p className="text-slate-400 text-sm leading-tight">{label}</p>
        {loading ? (
          <div className="w-12 h-7 bg-slate-700 rounded animate-pulse mt-1" />
        ) : (
          <p className={`text-3xl font-bold mt-0.5 ${c.val}`}>{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Shift type label ─────────────────────────────────────────────────────────
const SHIFT_TYPE_LABEL: Record<number, { label: string; color: string }> = {
  [ShiftType.Day]:    { label: 'Kunduz',    color: 'bg-amber-500/20 text-amber-300'   },
  [ShiftType.Night]:  { label: 'Kecha',     color: 'bg-blue-500/20 text-blue-300'     },
  [ShiftType.OnCall]: { label: 'Navbatchi', color: 'bg-violet-500/20 text-violet-300' },
}

const SHIFT_STATUS_LABEL: Record<number, { label: string; color: string }> = {
  [ShiftStatus.Scheduled]:  { label: 'Rejalashtirilgan', color: 'bg-cyan-500/20 text-cyan-300'     },
  [ShiftStatus.Completed]:  { label: 'Tugallangan',      color: 'bg-emerald-500/20 text-emerald-300'},
  [ShiftStatus.Missed]:     { label: 'O\'tkazib yuborildi', color: 'bg-red-500/20 text-red-300'    },
  [ShiftStatus.Swapped]:    { label: 'Almashtirildi',    color: 'bg-violet-500/20 text-violet-300' },
  [ShiftStatus.Cancelled]:  { label: 'Bekor qilindi',    color: 'bg-slate-500/20 text-slate-300'   },
}

const LEAVE_STATUS_LABEL: Record<number, { label: string; color: string }> = {
  [LeaveStatus.Pending]:  { label: 'Kutilmoqda',    color: 'bg-amber-500/20 text-amber-300'   },
  [LeaveStatus.Approved]: { label: 'Tasdiqlandi',   color: 'bg-emerald-500/20 text-emerald-300'},
  [LeaveStatus.Rejected]: { label: 'Rad etildi',    color: 'bg-red-500/20 text-red-300'       },
}

const SWAP_STATUS_LABEL: Record<number, { label: string; color: string }> = {
  [SwapStatus.Pending]:  { label: 'Kutilmoqda', color: 'bg-amber-500/20 text-amber-300'    },
  [SwapStatus.Accepted]: { label: 'Qabul qilindi', color: 'bg-blue-500/20 text-blue-300'   },
  [SwapStatus.Rejected]: { label: 'Rad etildi',  color: 'bg-red-500/20 text-red-300'       },
  [SwapStatus.Approved]: { label: 'Tasdiqlandi', color: 'bg-emerald-500/20 text-emerald-300'},
}

const NOTIF_TYPE_ICON: Record<number, string> = {
  [NotificationType.ScheduleChange]: ICONS.schedule,
  [NotificationType.CertExpiry]:     ICONS.leave,
  [NotificationType.ShiftSwap]:      ICONS.swap,
  [NotificationType.LeaveStatus]:    ICONS.check,
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtTime(t: string) {
  return t.substring(0, 5)
}
function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Hozirgina'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} soat oldin`
  return `${Math.floor(hrs / 24)} kun oldin`
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title, action, actionLabel, children, loading,
}: {
  title: string
  action?: () => void
  actionLabel?: string
  children: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        {action && (
          <button
            onClick={action}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {actionLabel ?? "Barchasi"}
            <Icon path={ICONS.arrow} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-600 text-sm">{text}</div>
  )
}

// ─── Role-based dashboard sections ────────────────────────────────────────────

// SuperAdmin: hospitals + users + shifts
function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState<HospitalResponseModel[]>([])
  const [users,     setUsers]     = useState<UserResponseModel[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.allSettled([
      hospitalService.getAll(),
      userService.getAll(),
    ]).then(([h, u]) => {
      if (h.status === 'fulfilled' && h.value.data.succedded) setHospitals(h.value.data.result ?? [])
      if (u.status === 'fulfilled' && u.value.data.succedded) setUsers(u.value.data.result ?? [])
      setLoading(false)
    })
  }, [])

  const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const newToday = users.filter(u => new Date(u.createdOn) >= weekAgo).length
  const inactiveCount = users.filter(u => !u.isActive).length

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Shifoxonalar"      value={hospitals.length} icon={ICONS.hospitals} color="cyan"    loading={loading} onClick={() => navigate('/hospitals')} />
        <StatCard label="Jami xodimlar"     value={users.length}     icon={<UsersIcon className="w-6 h-6" />} color="blue" loading={loading} onClick={() => navigate('/users')} />
        <StatCard label="Yangi xodimlar (7 kun)" value={newToday} icon={ICONS.check} color="emerald" loading={loading} onClick={() => navigate('/users?filter=new')} />
        <StatCard label="Faolsizlar" value={inactiveCount} icon={ICONS.inactive} color="amber" loading={loading} onClick={() => navigate('/users?filter=inactive')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hospitals */}
        <Section title="Shifoxonalar" action={() => navigate('/hospitals')} loading={loading}>
          {hospitals.length === 0 ? <Empty text="Shifoxonalar topilmadi" /> : (
            <div className="divide-y divide-slate-800">
              {hospitals.slice(0, 6).map(h => (
                <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">{h.name}</p>
                    <p className="text-slate-500 text-xs">{h.address}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${h.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {h.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Users */}
        <Section title="So'nggi xodimlar" action={() => navigate('/users')} loading={loading}>
          {users.length === 0 ? <Empty text="Xodimlar topilmadi" /> : (
            <div className="divide-y divide-slate-800">
              {users.slice(0, 6).map(u => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/30 to-blue-600/30 flex items-center justify-center text-cyan-400 text-[10px] font-bold flex-shrink-0">
                      {(u.fullName ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{u.fullName}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {u.roleType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  )
}

// ─── HospitalAdmin Dashboard ──────────────────────────────────────────────────
function HospitalAdminDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const userId    = user?.id ?? ''

  const [users,   setUsers]   = useState<UserResponseModel[]>([])
  const [shifts,  setShifts]  = useState<ShiftResponseModel[]>([])
  const [leaves,  setLeaves]  = useState<LeaveRequestResponseModel[]>([])
  const [swaps,   setSwaps]   = useState<ShiftSwapResponseModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      userService.getAll(),
      shiftService.getAll(),
      leaveRequestService.getPending(),
      shiftSwapService.getPending(),
    ]).then(([u, s, l, sw]) => {
      if (u.status  === 'fulfilled' && u.value.data.succedded)  setUsers(u.value.data.result  ?? [])
      if (s.status  === 'fulfilled' && s.value.data.succedded)  setShifts(s.value.data.result ?? [])
      if (l.status  === 'fulfilled' && l.value.data.succedded)  setLeaves(l.value.data.result ?? [])
      if (sw.status === 'fulfilled' && sw.value.data.succedded) setSwaps(sw.value.data.result ?? [])
      setLoading(false)
    })
  }, [userId])

  const today         = new Date().toDateString()
  const todayShifts   = shifts.filter(s => new Date(s.shiftDate).toDateString() === today)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Xodimlar"
          value={users.length}
          icon={<UsersIcon className="w-6 h-6" />}
          color="cyan"
          loading={loading}
          onClick={() => navigate('/users')}
        />
        <StatCard
          label="Bugungi smenalar"
          value={todayShifts.length}
          icon={ICONS.shifts}
          color="emerald"
          loading={loading}
          onClick={() => navigate('/shifts')}
        />
        <StatCard
          label="Kutilayotgan ta'tillar"
          value={leaves.length}
          icon={ICONS.leave}
          color="amber"
          loading={loading}
          onClick={() => navigate('/leaves')}
        />
        <StatCard
          label="Smena almashuv"
          value={swaps.length}
          icon={ICONS.swap}
          color="violet"
          loading={loading}
          onClick={() => navigate('/swaps')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today shifts */}
        <Section title="Bugungi smenalar" action={() => navigate('/shifts')} loading={loading}>
          {todayShifts.length === 0 ? <Empty text="Bugun smena yo'q" /> : (
            <div className="divide-y divide-slate-800">
              {todayShifts.slice(0, 6).map(s => {
                const st = SHIFT_STATUS_LABEL[s.status]  ?? { label: '', color: '' }
                const ty = SHIFT_TYPE_LABEL[s.shiftType] ?? { label: '', color: '' }
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{s.userFullName}</p>
                      <p className="text-slate-500 text-xs">{s.departmentName} · {fmtTime(s.startTime)} — {fmtTime(s.endTime)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ty.color}`}>{ty.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Pending leaves */}
        <Section title="Kutilayotgan ta'til so'rovlar" action={() => navigate('/leaves')} loading={loading}>
          {leaves.length === 0 ? <Empty text="Kutilayotgan so'rovlar yo'q" /> : (
            <div className="divide-y divide-slate-800">
              {leaves.slice(0, 6).map(l => {
                const st = LEAVE_STATUS_LABEL[l.status] ?? { label: '', color: '' }
                return (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{l.userFullName}</p>
                      <p className="text-slate-500 text-xs">{fmtDate(l.startDate)} — {fmtDate(l.endDate)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </>
  )
}

function DeptHeadDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const userId    = user?.id ?? ''
  const myDeptId  = (user as any)?.departmentId ?? ''

  const [users,       setUsers]       = useState<UserResponseModel[]>([])
  const [shifts,      setShifts]      = useState<ShiftResponseModel[]>([])
  const [leaves,      setLeaves]      = useState<LeaveRequestResponseModel[]>([])
  const [swaps,       setSwaps]       = useState<ShiftSwapResponseModel[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.allSettled([
      userService.getAll(),
      shiftService.getAll(),
      leaveRequestService.getPending(),
      shiftSwapService.getPending(),
    ]).then(([u, s, l, sw]) => {
      // Faqat shu bo'limdagi xodimlar
      if (u.status  === 'fulfilled' && u.value.data.succedded)
        setUsers((u.value.data.result ?? []).filter(usr => usr.departmentId === myDeptId))
      // Faqat shu bo'limdagi smenalar
      if (s.status  === 'fulfilled' && s.value.data.succedded)
        setShifts((s.value.data.result ?? []).filter(sh => sh.departmentId === myDeptId))
      // Faqat shu bo'limdagi xodimlar userId lari orqali filter
      const deptUserIds = new Set(
        (u.status === 'fulfilled' && u.value.data.succedded ? u.value.data.result ?? [] : [])
          .filter(usr => usr.departmentId === myDeptId)
          .map(usr => usr.id)
      )
      if (l.status  === 'fulfilled' && l.value.data.succedded)
        setLeaves((l.value.data.result ?? []).filter(lv => deptUserIds.has(lv.userId)))
      if (sw.status === 'fulfilled' && sw.value.data.succedded)
        setSwaps((sw.value.data.result ?? []).filter(swp => deptUserIds.has(swp.requesterId)))
      setLoading(false)
    })
  }, [userId, myDeptId])

  const today       = new Date().toDateString()
  const todayShifts = shifts.filter(s => new Date(s.shiftDate).toDateString() === today)

  // Davomat foizi — bugungi smenalardan kelgan xodimlar soni (shiftStatus orqali)
  const completedShifts = todayShifts.filter(s => s.status === 2 || s.status === 1) // Completed or InProgress
  const attendanceRate = todayShifts.length > 0
    ? Math.round((completedShifts.length / todayShifts.length) * 100)
    : 0

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Bo'limdagi xodimlar"
          value={users.length}
          icon={ICONS.users}
          color="cyan"
          loading={loading}
          onClick={() => navigate('/users')}
        />
        <StatCard
          label="Bugungi smenalar"
          value={todayShifts.length}
          icon={ICONS.shifts}
          color="blue"
          loading={loading}
          onClick={() => navigate('/shifts')}
        />
        <StatCard
          label="Kutilayotgan ta'tillar"
          value={leaves.length}
          icon={ICONS.leave}
          color="amber"
          loading={loading}
          onClick={() => navigate('/leaves')}
        />
        <StatCard
          label="Bugungi davomat"
          value={`${attendanceRate}%`}
          icon={ICONS.attend}
          color={attendanceRate >= 80 ? 'emerald' : 'amber'}
          loading={loading}
          onClick={() => navigate('/attendance')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Bugungi smenalar" action={() => navigate('/shifts')} loading={loading}>
          {todayShifts.length === 0 ? <Empty text="Bugun smena yo'q" /> : (
            <div className="divide-y divide-slate-800">
              {todayShifts.slice(0, 6).map(s => {
                const st = SHIFT_STATUS_LABEL[s.status]  ?? { label: '', color: '' }
                const ty = SHIFT_TYPE_LABEL[s.shiftType] ?? { label: '', color: '' }
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{s.userFullName}</p>
                      <p className="text-slate-500 text-xs">{s.departmentName} · {fmtTime(s.startTime)} — {fmtTime(s.endTime)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ty.color}`}>{ty.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="Smena almashuv so'rovlari" action={() => navigate('/swaps')} loading={loading}>
          {swaps.length === 0 ? <Empty text="Almashuv so'rovlari yo'q" /> : (
            <div className="divide-y divide-slate-800">
              {swaps.slice(0, 6).map(sw => {
                const st = SWAP_STATUS_LABEL[sw.status] ?? { label: '', color: '' }
                return (
                  <div key={sw.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{sw.requesterFullName ?? fmtDate(sw.shiftDate)}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[200px]">{sw.reason}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </>
  )
}

// Employee: my shifts + notifications + leaves + swaps
function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const userId    = user?.id ?? ''

  const [shifts,  setShifts]  = useState<ShiftResponseModel[]>([])
  const [leaves,  setLeaves]  = useState<LeaveRequestResponseModel[]>([])
  const [swaps,   setSwaps]   = useState<ShiftSwapResponseModel[]>([])
  const [notifs,  setNotifs]  = useState<NotificationResponseModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.allSettled([
      shiftService.getByUser(userId),
      leaveRequestService.getByUser(userId),
      shiftSwapService.getByUser(userId),
      notificationService.getMy(),
    ]).then(([s, l, sw, n]) => {
      if (s.status  === 'fulfilled' && s.value.data.succedded)  setShifts(s.value.data.result   ?? [])
      if (l.status  === 'fulfilled' && l.value.data.succedded)  setLeaves(l.value.data.result   ?? [])
      if (sw.status === 'fulfilled' && sw.value.data.succedded) setSwaps(sw.value.data.result   ?? [])
      if (n.status  === 'fulfilled' && n.value.data.succedded)  setNotifs(n.value.data.result   ?? [])
      setLoading(false)
    })
  }, [userId])

  const upcoming = shifts
    .filter(s => new Date(s.shiftDate) >= new Date())
    .sort((a, b) => new Date(a.shiftDate).getTime() - new Date(b.shiftDate).getTime())

  const unreadNotifs = notifs.filter(n => !n.isRead)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Jami smenalarim"    value={shifts.length}       icon={ICONS.shifts}   color="cyan"    loading={loading} onClick={() => navigate('/my-shifts')} />
        <StatCard label="Kelgusi smenalar"   value={upcoming.length}     icon={ICONS.schedule} color="blue"    loading={loading} onClick={() => navigate('/my-shifts')} />
        <StatCard label="Ta'til so'rovlarim" value={leaves.length}       icon={ICONS.leave}    color="amber"   loading={loading} onClick={() => navigate('/leaves')}    />
        <StatCard label="O'qilmagan xabarlar" value={unreadNotifs.length} icon={ICONS.bell}   color="violet"  loading={loading}                                         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming shifts */}
        <Section title="Kelgusi smenalarim" action={() => navigate('/my-shifts')} loading={loading}>
          {upcoming.length === 0 ? <Empty text="Kelgusi smenalar yo'q" /> : (
            <div className="divide-y divide-slate-800">
              {upcoming.slice(0, 6).map(s => {
                const ty = SHIFT_TYPE_LABEL[s.shiftType]  ?? { label: '', color: '' }
                const st = SHIFT_STATUS_LABEL[s.status]   ?? { label: '', color: '' }
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{fmtDate(s.shiftDate)}</p>
                      <p className="text-slate-500 text-xs">{s.departmentName} · {fmtTime(s.startTime)} — {fmtTime(s.endTime)}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ty.color}`}>{ty.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        <div className="space-y-4">
          {/* Notifications */}
          <Section title="Xabarlar" loading={loading}>
            {notifs.length === 0 ? <Empty text="Xabarlar yo'q" /> : (
              <div className="divide-y divide-slate-800">
                {notifs.slice(0, 4).map(n => (
                  <div key={n.id} className={`flex items-start gap-3 px-5 py-3 transition-colors ${!n.isRead ? 'bg-cyan-500/5' : 'hover:bg-slate-800/40'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Icon path={NOTIF_TYPE_ICON[n.type] ?? ICONS.bell} className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>{n.message}</p>
                      <p className="text-slate-600 text-[10px] mt-0.5">{fmtRelative(n.createdOn)}</p>
                    </div>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-2" />}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Swaps */}
          <Section title="Smena almashuv" action={() => navigate('/swaps')} loading={loading}>
            {swaps.length === 0 ? <Empty text="Almashuv so'rovlari yo'q" /> : (
              <div className="divide-y divide-slate-800">
                {swaps.slice(0, 3).map(sw => {
                  const st = SWAP_STATUS_LABEL[sw.status] ?? { label: '', color: '' }
                  return (
                    <div key={sw.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                      <div>
                        <p className="text-white text-sm font-medium">{fmtDate(sw.shiftDate)}</p>
                        <p className="text-slate-500 text-xs truncate max-w-[180px]">{sw.reason}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  )
}

// ─── Welcome banner ───────────────────────────────────────────────────────────
function WelcomeBanner({ user }: { user: UserResponseModel | null }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech'

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 flex items-center justify-between overflow-hidden relative">
      {/* bg glow */}
      <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />
      <div>
        <p className="text-slate-400 text-sm">{greeting} 👋</p>
        <h2 className="text-white text-xl font-bold mt-0.5">{user?.fullName ?? 'Foydalanuvchi'}</h2>
      </div>
      <div className="hidden sm:flex items-center gap-3">
        <div className="text-right">
          <p className="text-slate-500 text-xs">Bugungi sana</p>
          <p className="text-white text-base font-semibold">
            {(() => {
              const d = new Date()
              const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
              return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`
            })()}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon path={ICONS.schedule} className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.roleType ?? 'Employee'

  return (
    <div className="p-4 sm:p-6">
      <WelcomeBanner user={user} />

      {role === 'SuperAdmin' && <SuperAdminDashboard />}
      {role === 'HospitalAdmin' && <HospitalAdminDashboard />}
      {role === 'DeptHead' && <DeptHeadDashboard />}
      {role === 'Employee' && <EmployeeDashboard />}
    </div>
  )
}