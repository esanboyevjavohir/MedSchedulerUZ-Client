import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { attendanceService, userService, shiftService, leaveRequestService } from '../../services'
import { UserRole, AttendanceStatus } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  alert:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  leave:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  shift:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

function getRoleEnum(roleType: any): UserRole {
  if (typeof roleType === 'number') return roleType as UserRole
  return (UserRole as any)[roleType] ?? UserRole.Employee
}

function StatWidget({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub?: string
  icon: string; color: 'cyan' | 'violet' | 'emerald' | 'amber' | 'red'
}) {
  const colors = {
    cyan:    'bg-cyan-500/10 text-cyan-400',
    violet:  'bg-violet-500/10 text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber:   'bg-amber-500/10 text-amber-400',
    red:     'bg-red-500/10 text-red-400',
  }
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon d={icon} />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ProgressRow({ label, value, total, color }: {
  label: string; value: number; total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-400">{label}</span>
        <span className={color}>{value} marta ({pct}%)</span>
      </div>
      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const role = getRoleEnum(user?.roleType)
  const isManager = role === UserRole.DeptHead
    || role === UserRole.HospitalAdmin
    || role === UserRole.SuperAdmin

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmployees:  0,
    presentCount:    0,
    lateCount:       0,
    absentCount:     0,
    totalShifts:     0,
    pendingLeaves:   0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        isManager ? userService.getAll() : Promise.resolve(null),
        user?.id   ? attendanceService.getByUser(user.id) : Promise.resolve(null),
        isManager  ? shiftService.getAll() : Promise.resolve(null),
        isManager  ? leaveRequestService.getPending() : Promise.resolve(null),
      ])

      // Xodimlar
      let empCount = 0
      if (results[0].status === 'fulfilled' && results[0].value?.data?.succedded) {
        empCount = (results[0].value.data.result ?? []).length
      }

      // Davomat
      let present = 0, late = 0, absent = 0
      if (results[1].status === 'fulfilled' && results[1].value?.data?.succedded) {
        const list = results[1].value.data.result ?? []
        present = list.filter((a: any) => a.status === AttendanceStatus.Present).length
        late    = list.filter((a: any) => a.status === AttendanceStatus.Late).length
        absent  = list.filter((a: any) => a.status === AttendanceStatus.Absent).length
      }

      // Smenalar
      let shiftCount = 0
      if (results[2].status === 'fulfilled' && results[2].value?.data?.succedded) {
        const today = new Date().toDateString()
        shiftCount = (results[2].value.data.result ?? [])
          .filter((s: any) => new Date(s.shiftDate).toDateString() === today).length
      }

      // Kutilayotgan ta'tillar
      let leaves = 0
      if (results[3].status === 'fulfilled' && results[3].value?.data?.succedded) {
        leaves = (results[3].value.data.result ?? []).length
      }

      setStats({
        totalEmployees: empCount,
        presentCount:   present,
        lateCount:      late,
        absentCount:    absent,
        totalShifts:    shiftCount,
        pendingLeaves:  leaves,
      })
    } catch (err) {
      console.error('Hisobot yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalAttendance = stats.presentCount + stats.lateCount + stats.absentCount
  const attendanceRate  = totalAttendance > 0
    ? Math.round((stats.presentCount / totalAttendance) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Hisobotlar yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon d={IC.chart} className="w-6 h-6 text-cyan-400" />
          Hisobotlar
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isManager
            ? "Muassasa xodimlarining davomat va smena ko'rsatkichlari"
            : "Shaxsiy davomat ko'rsatkichlaringiz"}
        </p>
      </div>

      {/* Stat widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isManager && (
          <StatWidget
            label="Jami xodimlar"
            value={stats.totalEmployees}
            icon={IC.users}
            color="cyan"
          />
        )}
        <StatWidget
          label="Davomat foizi"
          value={`${attendanceRate}%`}
          sub={`${stats.presentCount} ta o'z vaqtida`}
          icon={IC.check}
          color="emerald"
        />
        <StatWidget
          label="Kechikishlar"
          value={stats.lateCount}
          icon={IC.alert}
          color="amber"
        />
        <StatWidget
          label="Kelmagan"
          value={stats.absentCount}
          icon={IC.alert}
          color="red"
        />
        {isManager && (
          <StatWidget
            label="Bugungi smenalar"
            value={stats.totalShifts}
            icon={IC.shift}
            color="violet"
          />
        )}
        {isManager && (
          <StatWidget
            label="Kutilayotgan ta'tillar"
            value={stats.pendingLeaves}
            icon={IC.leave}
            color="amber"
          />
        )}
      </div>

      {/* Davomat taqsimoti */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">Davomat taqsimoti</h2>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Icon d={IC.calendar} className="w-3.5 h-3.5" />
            Jami: {totalAttendance} ta qayd
          </span>
        </div>

        {totalAttendance === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-600 text-sm">
            Davomat ma'lumotlari topilmadi
          </div>
        ) : (
          <div className="space-y-4">
            <ProgressRow
              label="O'z vaqtida (Present)"
              value={stats.presentCount}
              total={totalAttendance}
              color="text-emerald-400"
            />
            <ProgressRow
              label="Kechikish (Late)"
              value={stats.lateCount}
              total={totalAttendance}
              color="text-amber-400"
            />
            <ProgressRow
              label="Kelmagan (Absent)"
              value={stats.absentCount}
              total={totalAttendance}
              color="text-red-400"
            />
          </div>
        )}
      </div>

    </div>
  )
}