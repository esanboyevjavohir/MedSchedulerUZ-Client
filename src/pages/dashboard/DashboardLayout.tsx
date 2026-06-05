import { useState, createContext, useContext } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { UsersIcon } from '../../components/UsersIcon'

// ─── Sidebar Context ──────────────────────────────────────────────────────────
interface SidebarContextType { collapsed: boolean }
const SidebarContext = createContext<SidebarContextType>({ collapsed: false })
export const useSidebar = () => useContext(SidebarContext)

// ─── SVG Icon ────────────────────────────────────────────────────────────────
function Icon({ path, className = 'w-5 h-5' }: { path: string; className?: string }) {
  return (
    <svg className={`${className} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  )
}

const ICONS = {
  dashboard:      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  hospitals:      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users:          'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  departments:    'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  schedule:       'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  shifts:         'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  swap:           'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  leave:          'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  attendance:     'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  cert:           'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  reports:        'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  specialization: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  bell:           'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  logout:         'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  chevronR:       'M9 5l7 7-7 7',
  menu:           'M4 6h16M4 12h16M4 18h16',
}

// ─── Menu per role ────────────────────────────────────────────────────────────
type MenuItem  = { label: string; path: string; icon: keyof typeof ICONS | 'users'}
type MenuGroup = { group: string; items: MenuItem[] }

const MENUS: Record<string, MenuGroup[]> = {
  SuperAdmin: [
    {
      group: 'Asosiy',
      items: [
        { label: 'Dashboard',         path: '/dashboard',       icon: 'dashboard'   },
        { label: 'Shifoxonalar',       path: '/hospitals',       icon: 'hospitals'   },
        { label: "Bo'limlar",          path: '/departments',     icon: 'departments' },
        { label: 'Foydalanuvchilar',   path: '/users',           icon: 'users'       },
        { label: 'Mutaxassisliklar',   path: '/specializations', icon: 'specialization' },
      ],
    },
    {
      group: 'Boshqaruv',
      items: [
        { label: 'Jadvallar',          path: '/schedules',       icon: 'schedule'    },
        { label: 'Smenalar',           path: '/shifts',          icon: 'shifts'      },
        { label: 'Davomat',            path: '/attendance',      icon: 'attendance'  },
        { label: "Ta'til so'rovlar",   path: '/leaves',          icon: 'leave'       },
        { label: 'Smena almashuv',     path: '/swaps',           icon: 'swap'        },
        { label: 'Hisobotlar',         path: '/reports',         icon: 'reports'     },
        { label: 'Sertifikatlar',      path: '/certifications',  icon: 'cert'        },
      ],
    },
  ],
  HospitalAdmin: [
    {
      group: 'Asosiy',
      items: [
        { label: 'Dashboard',          path: '/dashboard',       icon: 'dashboard'      },
        { label: "Bo'limlar",          path: '/departments',     icon: 'departments'    },
        { label: 'Xodimlar',           path: '/users',           icon: 'users'          },
        { label: 'Mutaxassisliklar',   path: '/specializations', icon: 'specialization' },
      ],
    },
    {
      group: 'Jadval',
      items: [
        { label: 'Jadvallar',          path: '/schedules',       icon: 'schedule'    },
        { label: 'Smenalar',           path: '/shifts',          icon: 'shifts'      },
        { label: 'Davomat',            path: '/attendance',      icon: 'attendance'  },
        { label: "Ta'til so'rovlar",   path: '/leaves',          icon: 'leave'       },
        { label: 'Smena almashuv',     path: '/swaps',           icon: 'swap'        },
        { label: 'Hisobotlar',         path: '/reports',         icon: 'reports'     },
        { label: 'Sertifikatlar',      path: '/certifications',  icon: 'cert'        },
      ],
    },
  ],
  DeptHead: [
    {
      group: 'Asosiy',
      items: [
        { label: 'Dashboard',          path: '/dashboard',       icon: 'dashboard'   },
        { label: 'Xodimlar',           path: '/users',           icon: 'users'       },
        { label: 'Mutaxassisliklar',   path: '/specializations',  icon: 'specialization' },
      ],
    },
    {
      group: 'Jadval',
      items: [
        { label: 'Jadvallar',          path: '/schedules',       icon: 'schedule'    },
        { label: 'Smenalar',           path: '/shifts',          icon: 'shifts'      },
        { label: 'Davomat',            path: '/attendance',      icon: 'attendance'  },
        { label: "Ta'til so'rovlar",   path: '/leaves',          icon: 'leave'       },
        { label: 'Smena almashuv',     path: '/swaps',           icon: 'swap'        },
        { label: 'Hisobotlar',         path: '/reports',     icon: 'reports'    },
        { label: 'Sertifikatlar',      path: '/certifications',  icon: 'cert'        },
      ],
    },
  ],
  Employee: [
    {
      group: 'Asosiy',
      items: [
        { label: 'Dashboard',          path: '/dashboard',       icon: 'dashboard'   },
        { label: 'Mening smenalarim',  path: '/my-shifts',       icon: 'shifts'      },
        { label: "Bo'lim jadvali",      path: '/schedules',       icon: 'schedule'    },
        { label: 'Davomat',            path: '/attendance',      icon: 'attendance'  },
      ],
    },
    {
      group: "So'rovlar",
      items: [
        { label: "Ta'til so'rovi",     path: '/leaves',          icon: 'leave'       },
        { label: 'Smena almashuv',     path: '/swaps',           icon: 'swap'        },
        { label: 'Sertifikatlar',      path: '/certifications',  icon: 'cert'        },
      ],
    },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin:    'Super Admin',
  HospitalAdmin: 'Shifoxona Admin',
  DeptHead:      "Bo'lim boshlig'i",
  Employee:      'Xodim',
}

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin:    'text-violet-400',
  HospitalAdmin: 'text-cyan-400',
  DeptHead:      'text-blue-400',
  Employee:      'text-emerald-400',
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/hospitals':       'Shifoxonalar',
  '/departments':     "Bo'limlar",
  '/users':           'Foydalanuvchilar',
  '/schedules':       'Jadvallar',
  '/shifts':          'Smenalar',
  '/my-shifts':       'Mening smenalarim',
  '/attendance':      'Davomat',
  '/leaves':          "Ta'til so'rovlar",
  '/swaps':           'Smena almashuv',
  '/certifications':  'Sertifikatlar',
  '/specializations': 'Mutaxassisliklar',
  '/reports':         'Hisobotlar',
  '/profile':         'Profil',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  collapsed, onToggle, mobileOpen, onMobileClose,
}: {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role     = user?.roleType ?? 'Employee'
  const menu     = MENUS[role] ?? MENUS['Employee']
  const initials = getInitials(user?.fullName ?? 'U')

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        style={{ width: collapsed ? 72 : 248, transition: 'width 0.25s cubic-bezier(.4,0,.2,1)' }}
        className={[
          'fixed lg:relative inset-y-0 left-0 z-40',
          'flex flex-col h-screen',
          'bg-slate-900 border-r border-slate-800 overflow-hidden flex-shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-300 lg:transition-[width]',
        ].join(' ')}
      >
        {/* Logo row */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-[15px] whitespace-nowrap tracking-tight">
              Med<span className="text-cyan-400">Scheduler</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-hide">
          {menu.map((group, gi) => (
            <div key={group.group}>
              {/* Group separator / label */}
              {!collapsed ? (
                <p className={`px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none ${gi === 0 ? 'pt-3' : 'pt-4'}`}>
                  {group.group}
                </p>
              ) : (
                gi !== 0 && <div className="h-px bg-slate-800 mx-3 my-2" />
              )}

              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => [
                    'relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-150',
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  ].join(' ')}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
                      )}
                      {item.icon === 'users'
                        ? <UsersIcon />
                        : <Icon path={ICONS[item.icon as keyof typeof ICONS]} />
                      }
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-800 p-3 space-y-1 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-slate-800/50 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-tight">
                  {user?.fullName ?? 'Foydalanuvchi'}
                </p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${ROLE_COLORS[role] ?? 'text-slate-400'}`}>
                  {ROLE_LABELS[role] ?? role}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-1">
              <div
                title={user?.fullName}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold"
              >
                {initials}
              </div>
            </div>
          )}

          <button
            onClick={() => { logout(); navigate('/login') }}
            title="Chiqish"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm
                       text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Icon path={ICONS.logout} />
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Kengaytirish' : "Yig'ish"}
          className="hidden lg:flex absolute top-[22px] -right-1 w-6 h-6 rounded-full
                    bg-slate-700 border border-slate-600 z-50
                    items-center justify-center
                    text-slate-400 hover:text-white hover:bg-slate-600
                    transition-all shadow-md"
        >
          <svg
            className="w-3 h-3"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={ICONS.chevronR} />
          </svg>
        </button>
      </aside>
    </>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const role     = user?.roleType ?? 'Employee'
  const initials = getInitials(user?.fullName ?? 'U')
  const title    = PAGE_TITLES[location.pathname] ?? 'Dashboard'
  const d = new Date()
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']
  const dateStr = `${days[d.getDay()]}, ${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 bg-slate-950 flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Icon path={ICONS.menu} />
        </button>
        <div>
          <h1 className="text-white font-semibold text-[15px] leading-tight">{title}</h1>
          <p className="text-slate-500 text-[11px] capitalize leading-tight hidden sm:block">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          onClick={() => navigate('/notifications')} 
          className="relative w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <Icon path={ICONS.bell} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full ring-2 ring-slate-800" />
        </button>

        {/* User chip */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-1.5 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-white text-xs font-semibold leading-tight">{user?.fullName ?? 'Foydalanuvchi'}</p>
            <p className={`text-[10px] leading-tight ${ROLE_COLORS[role] ?? 'text-slate-400'}`}>
              {ROLE_LABELS[role] ?? role}
            </p>
          </div>
        </button>
      </div>
    </header>
  )
}

// ─── Layout root ──────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Topbar onMenuClick={() => setMobileOpen(o => !o)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}