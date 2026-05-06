'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/use-user'
import Link from 'next/link'
import { PenTool, RefreshCw, Search, FileText, TrendingUp, ClipboardCheck } from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const { user } = useUser()
  const [stats, setStats] = useState({ created: 0, improved: 0, audited: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const [createdRes, improvedRes, auditedRes] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('user_id', user.userId).eq('mode', 'create'),
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('user_id', user.userId).eq('mode', 'improve'),
        supabase.from('audits').select('*', { count: 'exact', head: true }).eq('user_id', user.userId),
      ])

      setStats({
        created: createdRes.count || 0,
        improved: improvedRes.count || 0,
        audited: auditedRes.count || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [user, supabase])

  const statCards = [
    { label: '作成記事数', value: stats.created, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: '改善記事数', value: stats.improved, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '診断数', value: stats.audited, icon: ClipboardCheck, color: 'text-green-500', bg: 'bg-green-50' },
  ]

  const quickActions = [
    { label: '記事作成', description: 'キーワードからSEO記事を自動生成', href: '/dashboard/create', icon: PenTool, color: 'text-purple-500' },
    { label: '記事改善', description: '既存記事のSEOスコアを改善', href: '/dashboard/improve', icon: RefreshCw, color: 'text-blue-500' },
    { label: 'SEO診断', description: 'サイトのSEO状態を総合診断', href: '/dashboard/audit', icon: Search, color: 'text-green-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
        <p className="text-sm text-gray-500 mt-1">SEOツールの概要</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${card.bg}`}>
                  <Icon size={20} className={card.color} />
                </div>
                <span className="text-sm text-gray-500">{card.label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {loading ? '-' : card.value}
              </p>
            </div>
          )
        })}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition cursor-pointer">
                  <Icon size={24} className={`${action.color} mb-3`} />
                  <h4 className="font-semibold text-gray-800 mb-1">{action.label}</h4>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
