import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services'
import type { NotificationResponseModel } from '../../types'
import { NotificationType } from '../../types'

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  )
}

const IC = {
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  cert:     'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  swap:     'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  leave:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  check:    'M5 13l4 4L19 7',
  checkAll: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
}

// ── Notification type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  [NotificationType.ScheduleChange]: {
    label: 'Jadval o\'zgarishi',
    icon:  IC.calendar,
    color: 'text-cyan-400',
    bg:    'bg-cyan-500/15 border-cyan-500/25',
  },
  [NotificationType.CertExpiry]: {
    label: 'Sertifikat muddati',
    icon:  IC.cert,
    color: 'text-amber-400',
    bg:    'bg-amber-500/15 border-amber-500/25',
  },
  [NotificationType.ShiftSwap]: {
    label: 'Smena almashuv',
    icon:  IC.swap,
    color: 'text-violet-400',
    bg:    'bg-violet-500/15 border-violet-500/25',
  },
  [NotificationType.LeaveStatus]: {
    label: 'Ta\'til holati',
    icon:  IC.leave,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/15 border-emerald-500/25',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRel = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1)   return 'Hozirgina'
  if (m < 60)  return `${m} daqiqa oldin`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h} soat oldin`
  const day = Math.floor(h / 24)
  if (day < 7) return `${day} kun oldin`
  return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotifItem({
  notif, onRead,
}: {
  notif: NotificationResponseModel
  onRead: (id: string) => void
}) {
  const tc = TYPE_CONFIG[notif.type] ?? {
    label: 'Xabar', icon: IC.bell, color: 'text-slate-400', bg: 'bg-slate-700/50 border-slate-600',
  }

  return (
    <div
      className={`flex items-start gap-4 px-4 sm:px-5 py-4 transition-colors border-b border-slate-800/60 last:border-0
        ${!notif.isRead ? 'bg-cyan-500/5 hover:bg-cyan-500/8' : 'hover:bg-slate-800/30'}`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${tc.bg} ${tc.color}`}>
        <Icon d={tc.icon} className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${tc.color}`}>
              {tc.label}
            </span>
            <p className={`text-sm mt-0.5 leading-snug ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
              {notif.message}
            </p>
            <p className="text-slate-600 text-xs mt-1">{fmtRel(notif.createdOn)}</p>
          </div>

          {/* Unread dot + mark as read */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {!notif.isRead && (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                <button
                  onClick={() => onRead(notif.id)}
                  className="text-slate-600 hover:text-cyan-400 transition-colors"
                  title="O'qilgan deb belgilash"
                >
                  <Icon d={IC.check} className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { user } = useAuth()

  const [notifs,  setNotifs]  = useState<NotificationResponseModel[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'all' | 'unread'>('all')
  const [marking, setMarking] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await notificationService.getMy()
      if (res.data.succedded) setNotifs(res.data.result ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [user?.id])

  const handleRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  const handleReadAll = async () => {
    setMarking(true)
    try {
      await notificationService.markAllAsRead()
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    } finally {
      setMarking(false)
    }
  }

  const unreadCount = notifs.filter(n => !n.isRead).length
  const displayed   = tab === 'unread' ? notifs.filter(n => !n.isRead) : notifs

  // Guruhlab ko'rsatish — bugun / bu hafta / eski
  const groupNotifs = (list: NotificationResponseModel[]) => {
    const today   = new Date().toDateString()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const groups: { label: string; items: NotificationResponseModel[] }[] = [
      { label: 'Bugun',     items: list.filter(n => new Date(n.createdOn).toDateString() === today) },
      { label: 'Bu hafta',  items: list.filter(n => new Date(n.createdOn).toDateString() !== today && new Date(n.createdOn).getTime() >= weekAgo) },
      { label: 'Oldingi',   items: list.filter(n => new Date(n.createdOn).getTime() < weekAgo) },
    ]
    return groups.filter(g => g.items.length > 0)
  }

  const groups = groupNotifs(displayed)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-xl">Bildirishnomalar</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : 'Hammasi o\'qilgan'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            disabled={marking}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300
                       bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20
                       px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <Icon d={IC.checkAll} className="w-4 h-4" />
            {marking ? 'Belgilanmoqda...' : 'Hammasini o\'qildi'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-4">
        {([['all', 'Hammasi'], ['unread', "O'qilmagan"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            {label}
            {key === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Icon d={IC.bell} className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">
              {tab === 'unread' ? "O'qilmagan xabarlar yo'q" : "Bildirishnomalar yo'q"}
            </p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <div className="px-5 py-2.5 bg-slate-800/40 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </p>
              </div>
              {group.items.map(n => (
                <NotifItem key={n.id} notif={n} onRead={handleRead} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}