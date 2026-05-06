'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/use-user'

export default function SettingsPage() {
  const supabase = createClient()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    site_url: '',
    site_name: '',
    site_type: '',
    industry: '',
    target_audience: '',
    tone: '',
    default_length: '3000〜5000',
  })

  useEffect(() => {
    if (!user) return
    const loadSettings = async () => {
      const { data } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('user_id', user.userId)
        .single()

      if (data) {
        setForm({
          site_url: data.site_url || '',
          site_name: data.site_name || '',
          site_type: data.site_type || '',
          industry: data.industry || '',
          target_audience: data.target_audience || '',
          tone: data.tone || '',
          default_length: data.default_char_count || '3000〜5000',
        })
      }
      setLoading(false)
    }
    loadSettings()
  }, [user, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('seo_settings')
      .upsert({
        user_id: user.userId,
        site_url: form.site_url,
        site_name: form.site_name,
        site_type: form.site_type,
        industry: form.industry,
        target_audience: form.target_audience,
        tone: form.tone,
        default_char_count: form.default_length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      setMessage('保存に失敗しました')
    } else {
      setMessage('設定を保存しました')
    }
    setSaving(false)
  }

  const fields = [
    { key: 'site_url', label: 'サイトURL', type: 'text', inputType: 'text', placeholder: 'https://example.com', hint: 'あなたのサイトのURLを入力してください' },
    { key: 'site_name', label: 'サイト名', type: 'text', inputType: 'text', placeholder: '例：にこのAI活用ブログ', hint: '' },
    { key: 'site_type', label: 'サイトの種類', type: 'select', inputType: 'select', placeholder: '', hint: 'サイトの種類によって、最適なSEOアドバイスが変わります',
      options: [
        { value: '', label: '選択してください' },
        { value: '企業HP（コーポレートサイト）', label: '企業HP（コーポレートサイト）' },
        { value: '個人ブログ', label: '個人ブログ' },
        { value: 'ECサイト（ネットショップ）', label: 'ECサイト（ネットショップ）' },
        { value: 'メディアサイト（ニュース・情報サイト）', label: 'メディアサイト（ニュース・情報サイト）' },
        { value: 'LP（ランディングページ）', label: 'LP（ランディングページ）' },
        { value: 'ポートフォリオサイト', label: 'ポートフォリオサイト' },
        { value: 'サービス紹介サイト', label: 'サービス紹介サイト' },
        { value: 'その他', label: 'その他' },
      ]
    },
    { key: 'industry', label: '業種・ジャンル', type: 'text', inputType: 'text', placeholder: '例：AIコンサル / 美容院 / 飲食店 / Web制作', hint: 'あなたの業種やサイトのジャンルを入力してください' },
    { key: 'target_audience', label: 'ターゲット（このサイトを見てほしい人）', type: 'text', inputType: 'text', placeholder: '例：AI導入を検討している中小企業の経営者', hint: 'どんな人に読んでほしいですか？具体的に書くほど、的確なアドバイスが出ます' },
    { key: 'tone', label: '文章のトーン（雰囲気）', type: 'text', inputType: 'text', placeholder: '例：専門的だけどわかりやすい / カジュアルで親しみやすい', hint: 'どんな雰囲気の文章にしたいですか？' },
    { key: 'default_length', label: '記事の目安文字数', type: 'text', inputType: 'text', placeholder: '3000〜5000', hint: '1記事あたりの目安文字数。SEO的には3000文字以上が推奨です' },
  ]

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">設定</h2>
        <p className="text-sm text-gray-500 mt-1">あなたのサイト情報を設定すると、より的確なSEOアドバイスが出ます</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {(field as any).options.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder={field.placeholder}
              />
            )}
            {field.hint && (
              <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
            )}
          </div>
        ))}

        {message && (
          <p className={`text-sm ${message.includes('失敗') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </form>
    </div>
  )
}
