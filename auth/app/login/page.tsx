import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{ backgroundColor: '#faf8f1', color: '#0e1a3b' }}
    >
      {/* Ambient paper + network pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(184,151,88,0.08), transparent 60%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(14,26,59,0.05), transparent 60%)',
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="net-login" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 36 H72 M36 0 V72 M0 0 L72 72 M72 0 L0 72" stroke="#0e1a3b" strokeWidth="0.4" opacity="0.05" />
              <circle cx="36" cy="36" r="1.3" fill="#0e1a3b" opacity="0.22" />
              <circle cx="0" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="0" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
            </pattern>
            <linearGradient id="net-login-mask" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="60%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#net-login)" />
          <rect width="100%" height="100%" fill="url(#net-login-mask)" style={{ mixBlendMode: 'lighten' }} />
        </svg>
      </div>

      <Suspense fallback={<div style={{ color: '#8a8fa0' }}>読み込み中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
