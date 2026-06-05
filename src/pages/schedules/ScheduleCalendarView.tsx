import { useEffect, useState } from 'react'
import { shiftService } from '../../services'
import type { ShiftResponseModel, ScheduleResponseModel } from '../../types'
import { ShiftType, ShiftStatus } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}
const IC = {
  close:  'M6 18L18 6M6 6l12 12',
  back:   'M10 19l-7-7m0 0l7-7m-7 7h18',
  sun:    'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon:   'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  phone:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user:   'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  check:  'M5 13l4 4L19 7',
  cancel: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  swap:   'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
}

const DAYS_UZ = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
const DAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak']

const SHIFT_COLORS = {
  [ShiftType.Day]:    { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-400', label: 'Kunduzgi' },
  [ShiftType.Night]:  { bg: 'bg-blue-500/20',  border: 'border-blue-500/40',  text: 'text-blue-300',  dot: 'bg-blue-400',  label: 'Tungi'    },
  [ShiftType.OnCall]: { bg: 'bg-violet-500/20',border: 'border-violet-500/40',text: 'text-violet-300',dot: 'bg-violet-400',label: 'Navbatchi'},
}

const STATUS_COLORS = {
  [ShiftStatus.Scheduled]: 'border-l-cyan-400',
  [ShiftStatus.Completed]: 'border-l-emerald-400',
  [ShiftStatus.Missed]:    'border-l-red-400',
  [ShiftStatus.Swapped]:   'border-l-violet-400',
  [ShiftStatus.Cancelled]: 'border-l-slate-500',
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-cyan-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-blue-400 to-indigo-500',
  'from-green-400 to-emerald-500',
  'from-red-400 to-rose-500',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function fmtTime(t: string) { return t.substring(0, 5) }
function fmtShortDate(d: Date) {
  const months = ['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

interface Props {
  schedule: ScheduleResponseModel
  onClose: () => void
}

export function ScheduleCalendarView({ schedule, onClose }: Props) {
  const [shifts,  setShifts]  = useState<ShiftResponseModel[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ShiftResponseModel | null>(null)

  useEffect(() => {
    shiftService.getBySchedule(schedule.id).then(r => {
      if (r.data.succedded) setShifts(r.data.result ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [schedule.id])

  // Hafta kunlarini hisoblash
  const weekStart = new Date(schedule.weekStart)
  const weekDays: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    weekDays.push(d)
  }

  // Xodimlar ro'yxati (unique)
  const employees = Array.from(
    new Map(shifts.map(s => [s.userId, { id: s.userId, name: s.userFullName }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Shift topish: userId + date
  const getShift = (userId: string, date: Date) =>
    shifts.find(s =>
        s.userId === userId &&
        new Date(s.shiftDate).toDateString() === date.toDateString() &&
        s.status !== ShiftStatus.Cancelled
    )

  const today = new Date().toDateString()

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.back} className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">{schedule.departmentName}</h2>
            <p className="text-slate-500 text-xs">{schedule.hospitalName} · Haftalik jadval</p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-4">
          {Object.entries(SHIFT_COLORS).map(([type, c]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              <span className="text-slate-400 text-xs">{c.label}</span>
            </div>
          ))}
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-400 text-xs">Dam olish</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{shifts.length} ta smena</p>
            <p className="text-slate-500 text-xs">{employees.length} ta xodim</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 border-b border-slate-800">
                {/* Xodim ustuni */}
                <th className="text-left px-4 py-3 w-48 border-r border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon d={IC.user} className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Xodim</span>
                  </div>
                </th>
                {/* Kun ustunlari */}
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === today
                  const isSunday = day.getDay() === 0
                  return (
                    <th key={i} className={`px-3 py-3 text-center border-r border-slate-800 min-w-[120px] ${isSunday ? 'bg-slate-800/30' : ''}`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isSunday ? 'text-slate-600' : 'text-slate-400'}`}>
                        {DAYS_SHORT[i]}
                      </div>
                      <div className={`text-sm font-bold inline-flex items-center justify-center w-8 h-8 rounded-full mx-auto ${
                        isToday ? 'bg-cyan-500 text-white' : isSunday ? 'text-slate-600' : 'text-white'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isSunday ? 'text-slate-700' : 'text-slate-600'}`}>
                        {fmtShortDate(day).split(' ')[1]}
                      </div>
                    </th>
                  )
                })}
                {/* Jami */}
                <th className="px-3 py-3 text-center w-16">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jami</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-500 text-sm">
                    Bu jadval uchun smenalar mavjud emas
                  </td>
                </tr>
              ) : (
                employees.map((emp, empIdx) => {
                  const empShifts = shifts.filter(s => s.userId === emp.id)
                  return (
                    <tr key={emp.id}
                      className={`border-b border-slate-800/60 transition-colors ${empIdx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'} hover:bg-slate-800/20`}>
                      {/* Xodim */}
                      <td className="px-4 py-3 border-r border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor(emp.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(emp.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-medium truncate">{emp.name}</p>
                            <p className="text-slate-500 text-[10px]">{empShifts.length} smena</p>
                          </div>
                        </div>
                      </td>

                      {/* Kunlar */}
                      {weekDays.map((day, dayIdx) => {
                        const shift = getShift(emp.id, day)
                        const isSunday = day.getDay() === 0
                        const isToday  = day.toDateString() === today
                        const c = shift ? SHIFT_COLORS[shift.shiftType] : null
                        const statusBorder = shift ? STATUS_COLORS[shift.status] : ''

                        return (
                          <td key={dayIdx}
                            className={`px-2 py-2 border-r border-slate-800 text-center ${isSunday ? 'bg-slate-800/20' : ''} ${isToday ? 'bg-cyan-500/5' : ''}`}>
                            {shift && c ? (
                              <button
                                onClick={() => setSelected(shift)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg border border-l-4 ${c.bg} ${c.border} ${statusBorder} transition-all hover:scale-105 hover:shadow-lg cursor-pointer`}
                              >
                                <div className={`text-[11px] font-bold ${c.text}`}>
                                  {fmtTime(shift.startTime)}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {fmtTime(shift.endTime)}
                                </div>
                                <div className={`flex items-center gap-1 mt-0.5`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                  <span className={`text-[9px] ${c.text} opacity-80`}>{c.label}</span>
                                </div>
                              </button>
                            ) : isSunday ? (
                              <div className="flex items-center justify-center h-12">
                                <span className="text-slate-700 text-lg">—</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-12">
                                <span className="text-slate-800 text-xs">·</span>
                              </div>
                            )}
                          </td>
                        )
                      })}

                      {/* Jami smena soni */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-bold ${empShifts.length > 0 ? 'text-cyan-400' : 'text-slate-700'}`}>
                          {empShifts.length}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {/* Footer — jami */}
            {employees.length > 0 && (
              <tfoot className="sticky bottom-0">
                <tr className="bg-slate-900 border-t border-slate-700">
                  <td className="px-4 py-2 border-r border-slate-800">
                    <span className="text-slate-500 text-xs font-semibold">Jami smenalar</span>
                  </td>
                  {weekDays.map((day, i) => {
                    const count = shifts.filter(s => new Date(s.shiftDate).toDateString() === day.toDateString()).length
                    const isSunday = day.getDay() === 0
                    return (
                      <td key={i} className="px-2 py-2 text-center border-r border-slate-800">
                        <span className={`text-sm font-bold ${count > 0 ? 'text-cyan-400' : 'text-slate-700'} ${isSunday ? '!text-slate-700' : ''}`}>
                          {isSunday ? '—' : count || '·'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-center">
                    <span className="text-sm font-bold text-white">{shifts.length}</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Smena detail modal */}
      {selected && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-5 py-4 border-b border-slate-800 ${SHIFT_COLORS[selected.shiftType].bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(selected.userFullName)} flex items-center justify-center text-white text-sm font-bold`}>
                    {getInitials(selected.userFullName)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{selected.userFullName}</p>
                    <p className="text-slate-400 text-xs">{selected.departmentName}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  <Icon d={IC.close} className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Smena turi */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Smena turi</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${SHIFT_COLORS[selected.shiftType].bg} border ${SHIFT_COLORS[selected.shiftType].border}`}>
                  <Icon d={selected.shiftType === ShiftType.Day ? IC.sun : selected.shiftType === ShiftType.Night ? IC.moon : IC.phone}
                    className={`w-3.5 h-3.5 ${SHIFT_COLORS[selected.shiftType].text}`} />
                  <span className={`text-xs font-semibold ${SHIFT_COLORS[selected.shiftType].text}`}>
                    {SHIFT_COLORS[selected.shiftType].label}
                  </span>
                </div>
              </div>

              {/* Sana */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Sana</span>
                <span className="text-white text-sm font-medium">
                  {DAYS_UZ[new Date(selected.shiftDate).getDay() === 0 ? 6 : new Date(selected.shiftDate).getDay() - 1]},&nbsp;
                  {fmtShortDate(new Date(selected.shiftDate))}
                </span>
              </div>

              {/* Vaqt */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Ish vaqti</span>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-bold">{fmtTime(selected.startTime)}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-white text-sm font-bold">{fmtTime(selected.endTime)}</span>
                </div>
              </div>

              {/* Holat */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Holat</span>
                <div className="flex items-center gap-1.5">
                  {selected.status === ShiftStatus.Scheduled  && <><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-cyan-400 text-xs font-medium">Rejalashtirilgan</span></>}
                  {selected.status === ShiftStatus.Completed  && <><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-emerald-400 text-xs font-medium">Bajarilgan</span></>}
                  {selected.status === ShiftStatus.Missed     && <><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-red-400 text-xs font-medium">O'tkazib yuborildi</span></>}
                  {selected.status === ShiftStatus.Swapped    && <><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-violet-400 text-xs font-medium">Almashtirildi</span></>}
                  {selected.status === ShiftStatus.Cancelled  && <><div className="w-2 h-2 rounded-full bg-slate-500" /><span className="text-slate-400 text-xs font-medium">Bekor qilindi</span></>}
                </div>
              </div>

              {/* On-call */}
              {selected.isOnCall && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Navbatchi</span>
                  <span className="text-violet-400 text-xs font-medium bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20">On-Call</span>
                </div>
              )}

              {/* Davomiylik */}
              <div className="mt-2 bg-slate-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Smena davomiyligi</span>
                <span className="text-white text-sm font-bold">
                  {(() => {
                    const [sh, sm] = selected.startTime.split(':').map(Number)
                    const [eh, em] = selected.endTime.split(':').map(Number)
                    let mins = (eh * 60 + em) - (sh * 60 + sm)
                    if (mins < 0) mins += 24 * 60
                    return `${Math.floor(mins/60)} soat ${mins%60 > 0 ? mins%60 + ' min' : ''}`
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}