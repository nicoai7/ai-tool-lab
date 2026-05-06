'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Settings, Search, PenTool, RefreshCw, BarChart3, FileText, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: BarChart3 },
  { href: '/dashboard/create', label: '記事作成', icon: PenTool },
  { href: '/dashboard/improve', label: '記事改善', icon: RefreshCw },
  { href: '/dashboard/audit', label: 'SEO診断', icon: Search },
  { href: '/dashboard/history', label: '履歴', icon: FileText },
  { href: '/dashboard/settings', label: '設定', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const Sidebar = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">SEO Tool</h1>
        <p className="text-xs text-gray-500 mt-1">SEO最適化された記事を自動生成</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-purple-100 text-purple-600 border border-purple-200'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <form action="/api/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full transition"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </form>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full">
        <Sidebar />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">SEO Tool</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-800 p-2">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {sidebarOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-gray-900/20 z-40" onClick={() => setSidebarOpen(false)} />
          <aside className="md:hidden fixed top-0 left-0 w-64 h-full bg-white border-r border-gray-200 z-50 flex flex-col">
            <Sidebar />
          </aside>
        </>
      )}

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 pt-16 md:p-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
