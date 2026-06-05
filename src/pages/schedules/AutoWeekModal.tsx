// src/pages/schedules/AutoWeekModal.tsx
// Import: scheduleService, shiftService, departmentService, hospitalService

import { useEffect, useState } from 'react'
import { scheduleService, shiftService, departmentService, hospitalService } from '../../services'
import type { DepartmentResponseModel, HospitalResponseModel } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}
const IC = {
  close:  'M6 18L18 6M6 6l12 12',
  auto:   'M13 10V3L4 14h7v7l9-11h-7z',
  check:  'M5 13l4 4L19 7',
  info:   'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warn:   'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  cal:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}

// Kelgusi Dushanbani topish
function getNextMonday(offset = 0): string {
  const d = new Date()
  const day = d.getDay()
  // Shu haftaning Dushanbasi
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff + offset * 7)
  return d.toISOString().split('T')[0]
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function fmtDate(d: string) {
  const date = new Date(d)
  const months = ['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek']
  const days = ['Yak','Du','Se','Ch','Pa','Ju','Sha']
  return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}`
}

interface Result {
  scheduleId: string
  createdCount: number
  skippedCount: number
  warnings: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: any
  currentRole: string
}

export function AutoWeekModal({ open, onClose, onSuccess, currentUser, currentRole }: Props) {
  const [hospitals,   setHospitals]   = useState<HospitalResponseModel[]>([])
  const [departments, setDepartments] = useState<DepartmentResponseModel[]>([])
  const [form, setForm] = useState({
    hospitalId:   '',
    departmentId: '',
    weekOffset:   0, 
  })
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState<'form' | 'result'>('form')
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState<Result | null>(null)

  const weekStart = getNextMonday(form.weekOffset)
  const weekEnd   = addDays(weekStart, 6)

  useEffect(() => {
    if (!open) return
    setStep('form'); setError(''); setResult(null)
    setForm({
      hospitalId:   currentUser?.hospitalId ?? '',
      departmentId: currentRole === 'DeptHead' ? (currentUser?.departmentId ?? '') : '',
      weekOffset:   0,
    })

    if (currentRole === 'SuperAdmin') {
      hospitalService.getAll().then(r => { if (r.data.succedded) setHospitals(r.data.result ?? []) })
    } else if (currentRole === 'HospitalAdmin' && currentUser?.hospitalId) {
  departmentService.getByHospital(currentUser.hospitalId).then(r => {
    if (r.data.succedded) setDepartments(r.data.result ?? [])
  })
} else if (currentRole === 'DeptHead' && currentUser?.hospitalId) {
  departmentService.getByHospital(currentUser.hospitalId).then(r => {
    if (r.data.succedded) setDepartments(r.data.result ?? [])
  })
}
  }, [open])

  useEffect(() => {
    if (!form.hospitalId || currentRole === 'DeptHead') return
    departmentService.getByHospital(form.hospitalId).then(r => {
      if (r.data.succedded) setDepartments(r.data.result ?? [])
      setForm(f => ({ ...f, departmentId: '' }))
    })
  }, [form.hospitalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.hospitalId)   { setError('Shifoxonani tanlang'); return }
    if (!form.departmentId) { setError("Bo'limni tanlang"); return }

    setLoading(true); setError('')
    try {
      // 1. Jadval yaratish
      const schedRes = await scheduleService.create({
        hospitalId:   form.hospitalId,
        departmentId: form.departmentId,
        weekStart,
        weekEnd,
        createdBy: currentUser?.id ?? '',
      })

      if (!schedRes.data.succedded) {
        setError(schedRes.data.errors?.[0] ?? 'Jadval yaratishda xatolik')
        return
      }

      const scheduleId = schedRes.data.result!.id

      // 2. Smenalar avtomatik generatsiya
      const shiftRes = await shiftService.autoGenerate({
        scheduleId,
        departmentId: form.departmentId,
        weekStart,
      })

      if (!shiftRes.data.succedded) {
        setError(shiftRes.data.errors?.[0] ?? 'Smena generatsiyasida xatolik')
        return
      }

      setResult({
        scheduleId,
        createdCount: shiftRes.data.result!.createdCount,
        skippedCount: shiftRes.data.result!.skippedCount,
        warnings:     shiftRes.data.result!.warnings ?? [],
      })
      setStep('result')

    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const deptName = departments.find(d => d.id === form.departmentId)?.name
    ?? currentUser?.departmentName
    ?? "Bo'lim"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Icon d={IC.auto} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Haftalik avtomatik tuzish</h2>
              <p className="text-slate-500 text-xs mt-0.5">Jadval + smenalar bir zarbada</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icon d={IC.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 'result' && result ? (
            /* ── Natija ── */
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Icon d={IC.check} className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">Muvaffaqiyatli!</p>
                  <p className="text-slate-400 text-sm mt-1">{deptName} · {fmtDate(weekStart)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 text-3xl font-bold">{result.createdCount}</p>
                  <p className="text-slate-400 text-xs mt-1">Smena yaratildi</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-3xl font-bold">{result.skippedCount}</p>
                  <p className="text-slate-500 text-xs mt-1">O'tkazildi</p>
                </div>
              </div>

              {/* Hafta oralig'i */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon d={IC.cal} className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400 text-xs">Hafta</span>
                </div>
                <span className="text-white text-sm font-medium">
                  {fmtDate(weekStart)} — {fmtDate(weekEnd)}
                </span>
              </div>

              {result.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon d={IC.warn} className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 text-xs font-semibold">
                      {result.warnings.length} ta ogohlantirish
                    </span>
                  </div>
                  {result.warnings.slice(0, 4).map((w, i) => (
                    <p key={i} className="text-amber-300/70 text-xs pl-6">• {w}</p>
                  ))}
                  {result.warnings.length > 4 && (
                    <p className="text-amber-400/50 text-xs pl-6">...va yana {result.warnings.length - 4} ta</p>
                  )}
                </div>
              )}

              <button onClick={() => { onSuccess(); onClose() }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl py-3 text-sm transition-all">
                Jadvalni ko'rish
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Algoritm info */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex gap-3">
                <Icon d={IC.info} className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-violet-300/80 space-y-1">
                  <p className="font-semibold text-violet-300">Avtomatik nima qiladi:</p>
                  <p>① Haftalik jadval yaratiladi</p>
                  <p>② Bo'lim xodimlariga round-robin smena taqsimlanadi</p>
                  <p>③ Ta'tildagi xodimlar hisobga olinadi</p>
                  <p>④ Du/Cho/Ju → Kunduzgi · Se/Pa/Sha → Tungi</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Shifoxona — faqat SuperAdmin */}
              {(currentRole === 'SuperAdmin') && (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">Shifoxona *</label>
    <select value={form.hospitalId}
      onChange={e => setForm(f => ({ ...f, hospitalId: e.target.value }))}
      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all">
      <option value="">Shifoxona tanlang</option>
      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
    </select>
  </div>
)}
{currentRole === 'HospitalAdmin' && (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
    <p className="text-slate-400 text-xs">Shifoxona</p>
    <p className="text-white text-sm font-medium mt-0.5">{currentUser?.hospitalName ?? 'Shifoxona'}</p>
  </div>
)}

              {/* Bo'lim */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Bo'lim *</label>
                {currentRole === 'DeptHead' ? (
                  <div className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm">
                    {currentUser?.departmentName ?? "Bo'lim"}
                  </div>
                ) : (
                  <select value={form.departmentId}
                    onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                    disabled={!form.hospitalId && currentRole === 'SuperAdmin'}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-40">
                    <option value="">Bo'lim tanlang</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                )}
              </div>

              {/* Hafta tanlash */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Qaysi hafta?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map(offset => (
                    <button key={offset} type="button"
                      onClick={() => setForm(f => ({ ...f, weekOffset: offset }))}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                        form.weekOffset === offset
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      <p className="font-semibold">{offset === 0 ? 'Shu hafta' : 'Keyingi hafta'}</p>
                      <p className="opacity-70 mt-0.5">{fmtDate(getNextMonday(offset))} — {fmtDate(addDays(getNextMonday(offset), 6))}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon d={IC.cal} className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400 text-xs">Tanlangan hafta</span>
                </div>
                <span className="text-white text-sm font-semibold">
                  {fmtDate(weekStart)} — {fmtDate(weekEnd)}
                </span>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl py-3.5 text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
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