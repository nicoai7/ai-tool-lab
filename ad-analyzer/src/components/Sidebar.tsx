'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Image,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Smartphone,
  Users,
  UserCircle,
  MapPin,
  Sparkles,
  Settings,
  Swords,
  LogIn,
  FileDown,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavDivider {
  type: 'divider';
  label: string;
}

const navItems: (NavItem | NavDivider)[] = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/demographics/summary', label: '属性サマリー', icon: BarChart3 },
  { type: 'divider', label: 'レポート' },
  { href: '/campaigns', label: 'キャンペーン別', icon: Megaphone },
  { href: '/adgroups', label: '広告グループ別', icon: BarChart3 },
  { href: '/creatives', label: '広告別', icon: Image },
  { href: '/reports/daily', label: '日別', icon: Calendar },
  { href: '/reports/monthly', label: '月別', icon: CalendarDays },
  { href: '/reports/weekday', label: '曜日別', icon: CalendarRange },
  { href: '/reports/hourly', label: '時間帯別', icon: Clock },
  { type: 'divider', label: '属性分析' },
  { href: '/demographics/device', label: 'デバイス', icon: Smartphone },
  { href: '/demographics/gender', label: '性別', icon: Users },
  { href: '/demographics/age', label: '年齢', icon: UserCircle },
  { href: '/demographics/region', label: '地域', icon: MapPin },
  { type: 'divider', label: 'AI分析' },
  { href: '/ai-advice', label: '改善スコアリング', icon: Sparkles },
  { href: '/competitors', label: '競合分析', icon: Swords },
  { type: 'divider', label: '出力' },
  { href: '/export', label: '一括出力', icon: FileDown },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, accountName, login } = useAuth();

  return (
    <aside className="w-60 bg-sidebar-bg text-sidebar-text flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <h1 className="text-lg font-bold text-white tracking-tight">
          📊 Ad Analyzer
        </h1>
        <p className="text-xs text-white/50 mt-0.5">Meta広告分析・改善ツール</p>
      </div>

      {/* 接続状態 */}
      <div className="px-4 py-2 border-b border-white/10">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/40">接続中</p>
              <p className="text-xs text-white/80 truncate">{accountName || 'アカウント選択中...'}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={login}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 text-xs hover:bg-blue-600/30 transition-colors"
          >
            <LogIn size={12} />
            広告アカウントを接続
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {navItems.map((item, i) => {
          if ('type' in item && item.type === 'divider') {
            return (
              <div key={i} className="mt-4 mb-1.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {item.label}
                </span>
              </div>
            );
          }

          if (!('href' in item)) return null;

          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-all mb-0.5 ${
                isActive
                  ? 'bg-sidebar-active text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {Icon && <Icon size={15} />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-2 border-t border-white/10">
        {!isAuthenticated && (
          <div className="mb-2 px-3 py-1 bg-yellow-500/10 rounded text-center">
            <span className="text-[10px] text-yellow-300 font-medium">DEMOモード</span>
          </div>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Settings size={15} />
          設定
        </Link>
      </div>
    </aside>
  );
}
