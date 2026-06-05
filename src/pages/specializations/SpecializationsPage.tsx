import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { specializationService, departmentService, hospitalService } from '../../services'
import type { SpecializationResponseModel, DepartmentResponseModel, HospitalResponseModel } from '../../types'

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  plus:     'M12 4v16m8-8H4',
  close:    'M6 18L18 6M6 6l12 12',
  check:    'M5 13l4 4L19 7',
  edit:     'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  spec:     'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  hospital: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
}

// ─── Spec Modal ───────────────────────────────────────────────────────────────
function SpecModal({ open, spec, departments, onClose, onSuccess }: {
  open: boolean
  spec: SpecializationResponseModel | null
  departments: DepartmentResponseModel[]
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!spec
  const [form, setForm]       = useState({ name: '', departmentId: '', isActive: true })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(''); setSuccess(false)
    if (spec) setForm({ name: spec.name, departmentId: spec.departmentId, isActive: spec.isActive })
    else setForm({ name: '', departmentId: '', isActive: true })
  }, [open, spec])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nomni kiriting'); return }
    if (!isEdit && !form.departmentId) { setError("Bo'limni tanlang"); return }
    setLoading(true); setError('')
    try {
      const res = isEdit
        ? await specializationService.update(spec!.id, { name: form.name, isActive: form.isActive })
        : await specializationService.create({ name: form.name, departmentId: form.departmentId })
      if (!res.data.succedded) { setError(res.data.errors?.[0] ?? 'Xatolik'); return }
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1200)
    } catch (err: any) {
      setError(err?.response?.data?.errors?.[0] ?? 'Serverga ulanishda xatolik')
    } finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Icon d={IC.spec} className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">{isEdit ? 'Tahrirlash' : 'Yangi mutaxassislik'}</h2>
              {isEdit && <p className="text-slate-500 text-xs">{spec!.departmentName}</p>}
            </div>
          </div>
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
              <p className="text-white font-semibold">{isEdit ? 'Saqlandi!' : "Qo'shildi!"}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {!isEdit && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Bo'lim *</label>
                  <select
                    value={form.departmentId}
                    onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  >
                    <option value="">Bo'limni tanlang</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.hospitalName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Mutaxassislik nomi *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Masalan: Kardiolog, Jarroh, Pediatr..."
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {isEdit && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Holat</label>
                  <div className="flex gap-3">
                    {[
                      { val: true,  label: 'Faol',   cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
                      { val: false, label: 'Nofaol', cls: 'border-red-500/40 bg-red-500/10 text-red-400'             },
                    ].map(opt => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isActive: opt.val }))}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          form.isActive === opt.val
                            ? opt.cls
                            : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {!form.isActive && (
                    <p className="text-amber-400 text-xs mt-2">
                      ⚠️ Nofaol qilish bu mutaxassislikni ro'yxatdan yashiradi
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm font-medium">
                  Bekor qilish
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 text-sm">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saqlanmoqda...</span></>
                    : isEdit ? 'Saqlash' : "Qo'shish"
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SpecializationsPage() {
  const { user } = useAuth()
  const role         = user?.roleType ?? ''
  const isSuperAdmin = role === 'SuperAdmin'
  const isHospAdmin  = role === 'HospitalAdmin'
  const isDeptHead   = role === 'DeptHead'
  const myHospitalId = (user as any)?.hospitalId   ?? ''
  const myDeptId     = (user as any)?.departmentId ?? ''

  const [specs,        setSpecs]        = useState<SpecializationResponseModel[]>([])
  const [departments,  setDepartments]  = useState<DepartmentResponseModel[]>([])
  const [hospitals,    setHospitals]    = useState<HospitalResponseModel[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [hospFilter, setHospFilter] = useState(isHospAdmin ? myHospitalId : '')
  const [deptFilter,   setDeptFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [showModal,    setShowModal]    = useState(false)
  const [editSpec,     setEditSpec]     = useState<SpecializationResponseModel | null>(null)

  // ── TUZATISH 1: departmentId orqali hospitalName va hospitalId olish ──────
  const getHospitalName = (deptId: string) =>
    departments.find(d => d.id === deptId)?.hospitalName ?? '—'

  const getHospitalId = (deptId: string) =>
    departments.find(d => d.id === deptId)?.hospitalId ?? ''
  // ─────────────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true)
    try {
      const promises: Promise<any>[] = [specializationService.getAll()]

      if (isSuperAdmin) {
        promises.push(departmentService.getAll())
        promises.push(hospitalService.getAll())
      } else if (isHospAdmin) {
        promises.push(departmentService.getByHospital(myHospitalId))
      } else if (isDeptHead) {
        promises.push(departmentService.getById(myDeptId))
      }

      const results = await Promise.allSettled(promises)

      if (results[0].status === 'fulfilled' && results[0].value.data.succedded)
        setSpecs(results[0].value.data.result ?? [])

      if (results[1]?.status === 'fulfilled' && results[1].value.data.succedded) {
        const d = results[1].value.data.result
        setDepartments(Array.isArray(d) ? d : (d ? [d] : []))
      }

      if (results[2]?.status === 'fulfilled' && results[2].value.data.succedded)
        setHospitals(results[2].value.data.result ?? [])

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleHospFilter = (hId: string) => {
    setHospFilter(hId)
    setDeptFilter('')
  }

  const filteredDepts = hospFilter
    ? departments.filter(d => d.hospitalId === hospFilter)
    : departments

  const filtered = specs.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
                        getHospitalName(s.departmentId).toLowerCase().includes(search.toLowerCase())

    // ── TUZATISH 2: hospitalId orqali filter ─────────────────────────────
    const matchHosp = !hospFilter || getHospitalId(s.departmentId) === hospFilter
    // ─────────────────────────────────────────────────────────────────────

    const matchDept   = isDeptHead
      ? s.departmentId === myDeptId
      : !deptFilter || s.departmentId === deptFilter

    const matchStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'active' ? s.isActive : !s.isActive

    return matchSearch && matchHosp && matchDept && matchStatus
  })

  const activeCount   = specs.filter(s => s.isActive).length
  const inactiveCount = specs.filter(s => !s.isActive).length

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Mutaxassisliklar</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Jami {specs.length} ta · {activeCount} faol · {inactiveCount} nofaol
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => { setEditSpec(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-cyan-500/20 text-sm"
          >
            <Icon d={IC.plus} className="w-4 h-4" />
            Yangi mutaxassislik
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-cyan-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="7" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Mutaxassislik, bo'lim yoki shifoxona..."
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
        </div>

        {isSuperAdmin && (
          <select
            value={hospFilter}
            onChange={e => handleHospFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[180px]"
          >
            <option value="">Barcha shifoxonalar</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}

        {!isDeptHead && (
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[180px]"
          >
            <option value="">Barcha bo'limlar</option>
            {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[140px]"
        >
          <option value="all">Barcha holat</option>
          <option value="active">Faol</option>
          <option value="inactive">Nofaol</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Icon d={IC.spec} className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Mutaxassisliklar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Mutaxassislik</th>
                    {isSuperAdmin && (
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Shifoxona</th>
                    )}
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Bo'lim</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Holat</th>
                    {isSuperAdmin && <th className="px-5 py-3.5 w-16" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon d={IC.spec} className="w-4 h-4 text-cyan-400" />
                          </div>
                          <p className="text-white text-sm font-medium">{s.name}</p>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                            <Icon d={IC.hospital} className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            {getHospitalName(s.departmentId)}
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <p className="text-slate-400 text-sm">{s.departmentName}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                          s.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {s.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => { setEditSpec(s); setShowModal(true) }}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all"
                            title="Tahrirlash"
                          >
                            <Icon d={IC.edit} className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-800">
              {filtered.map(s => (
                <div key={s.id} className="px-4 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon d={IC.spec} className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.name}</p>
                    <p className="text-slate-500 text-xs truncate">{s.departmentName}</p>
                    {isSuperAdmin && (
                      <p className="text-slate-600 text-xs truncate">{getHospitalName(s.departmentId)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                      s.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {s.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => { setEditSpec(s); setShowModal(true) }}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 flex items-center justify-center transition-all"
                      >
                        <Icon d={IC.edit} className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <SpecModal
        open={showModal}
        spec={editSpec}
        departments={departments}
        onClose={() => { setShowModal(false); setEditSpec(null) }}
        onSuccess={fetchData}
      />
    </div>
  )
}