import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-500">読み込み中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
