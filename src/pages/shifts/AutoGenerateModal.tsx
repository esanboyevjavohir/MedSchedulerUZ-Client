// Bu komponentni ShiftsPage.tsx ga qo'shing
// Import qatoriga qo'shing: scheduleService
// shiftService.autoGenerate(...) chaqiradi

import { useEffect, useState } from 'react'
import { scheduleService, shiftService } from '../../services'
import type { ScheduleResponseModel } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  close:  'M6 18L18 6M6 6l12 12',
  check:  'M5 13l4 4L19 7',
  auto:   'M13 10V3L4 14h7v7l9-11h-7z',
  warn:   'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  info:   'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: any
  currentRole: string
  preSelectedScheduleId?: string
  preSelectedDepartmentId?: string
  preSelectedWeekStart?: string
}

export function AutoGenerateModal({ open, onClose, onSuccess, currentUser, currentRole, preSelectedScheduleId, preSelectedDepartmentId, preSelectedWeekStart }: Props) {
  const [schedules,   setSchedules]   = useState<ScheduleResponseModel[]>([])
  const [form,        setForm]        = useState({ scheduleId: '', weekStart: '' })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [result,      setResult]      = useState<{ createdCount: number; skippedCount: number; warnings: string[] } | null>(null)

  useEffect(() => {
    if (!open) return
    setForm({
      scheduleId: preSelectedScheduleId ?? '',
      weekStart:  preSelectedWeekStart  ?? ''
    })
    setError(''); setResult(null)
    scheduleService.getAll().then(r => {
      if (r.data.succedded) {
        let list = r.data.result ?? []
        // DeptHead faqat o'z bo'limining jadvallarini ko'rsin
        if (currentRole === 'DeptHead' && currentUser?.departmentId) {
          list = list.filter(s => s.departmentId === currentUser.departmentId)
        }
        setSchedules(list)
      }
    })
  }, [open])

  // Jadval tanlanganida weekStart ni jadvaldan olamiz
  useEffect(() => {
    if (!form.scheduleId) return
    const schedule = schedules.find(s => s.id === form.scheduleId)
    if (schedule) {
      setForm(f => ({ ...f, weekStart: schedule.weekStart.split('T')[0] }))
    }
  }, [form.scheduleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.scheduleId) { setError('Jadval tanlang'); return }
    const schedule = schedules.find(s => s.id === form.scheduleId)
    if (!schedule) { setError('Jadval topilmadi'); return }

    setLoading(true); setError('')
    try {
      const res = await shiftService.autoGenerate({
        scheduleId:   form.scheduleId,
        departmentId: preSelectedDepartmentId ?? schedule.departmentId,
        weekStart:    form.weekStart,
      })
      if (!res.data.succedded) {
        setError(res.data.errors?.[0] ?? 'Xatolik yuz berdi')
        return
      }
      setResult(res.data.result!)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => { onSuccess(); onClose() }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
              <Icon d={IC.auto} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Avtomatik smena tuzish</h2>
              <p className="text-slate-500 text-xs mt-0.5">Round-robin algoritmi asosida</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {result ? (
            /* Natija */
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Icon d={IC.check} className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white font-bold text-lg">Smenalar yaratildi!</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 text-2xl font-bold">{result.createdCount}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Yaratildi</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-2xl font-bold">{result.skippedCount}</p>
                  <p className="text-slate-500 text-xs mt-0.5">O'tkazildi</p>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon d={IC.warn} className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-400 text-xs font-semibold">Ogohlantirishlar ({result.warnings.length})</p>
                  </div>
                  {result.warnings.slice(0, 5).map((w, i) => (
                    <p key={i} className="text-amber-300/70 text-xs pl-6">• {w}</p>
                  ))}
                  {result.warnings.length > 5 && (
                    <p className="text-amber-400/50 text-xs pl-6">...va yana {result.warnings.length - 5} ta</p>
                  )}
                </div>
              )}

              <button onClick={handleDone}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl py-3 text-sm transition-all">
                Smenalarni ko'rish
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Algoritm haqida ma'lumot */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                <Icon d={IC.info} className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-violet-300/80 space-y-1">
                  <p>Algoritm quyidagilarni avtomatik hisobga oladi:</p>
                  <p>• Ta'tildagi xodimlar smenaga qo'yilmaydi</p>
                  <p>• Round-robin: xodimlar adolatli taqsimlanadi</p>
                  <p>• Du/Cho/Ju → Kunduzgi, Se/Pa/Sha → Tungi smena</p>
                  <p>• Shanba/Yakshanba — navbatchi smena (IsOnCall)</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Jadval tanlash */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Jadval *</label>
                <select
                  value={form.scheduleId}
                  onChange={e => setForm(f => ({ ...f, scheduleId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                >
                  <option value="">Jadval tanlang</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.departmentName} · {s.weekStart?.split('T')[0]} — {s.weekEnd?.split('T')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hafta boshlanishi */}
              {form.weekStart && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-slate-400 text-xs">Hafta boshlanishi</p>
                  <p className="text-white text-sm font-medium">{form.weekStart}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.scheduleId}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Tuzilmoqda...</span></>
                ) : (
                  <><Icon d={IC.auto} className="w-4 h-4" /><span>Avtomatik tuzish</span></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}