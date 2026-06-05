export function UsersIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} flex-shrink-0`}>
      <circle cx="5" cy="8" r="3" fill="white" opacity="0.6" />
      <path d="M0 20c0-3.3 2.2-5 5-5s2 .4 2.5.8C5.8 17 5 18.8 5 21H0v-1z" fill="white" opacity="0.6" />
      <circle cx="19" cy="8" r="3" fill="white" opacity="0.6" />
      <path d="M24 20c0-3.3-2.2-5-5-5s-2 .4-2.5.8C18.2 17 19 18.8 19 21h5v-1z" fill="white" opacity="0.6" />
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7H4z" />
    </svg>
  )
}