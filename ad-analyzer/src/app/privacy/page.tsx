export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>
      <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
        <p>Ad Analyzer（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。</p>

        <h2 className="text-lg font-semibold text-foreground pt-2">1. 収集する情報</h2>
        <p>本アプリは、Meta広告アカウントの接続時に以下の情報にアクセスします。</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>広告アカウントの基本情報（アカウントID、アカウント名）</li>
          <li>広告パフォーマンスデータ（インプレッション、クリック、費用等）</li>
          <li>キャンペーン、広告セット、広告の名称</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground pt-2">2. 情報の利用目的</h2>
        <p>取得した情報は、広告パフォーマンスの分析およびレポート表示のためにのみ使用します。</p>

        <h2 className="text-lg font-semibold text-foreground pt-2">3. 情報の保管</h2>
        <p>本アプリはデータベースを持たず、アクセストークンはブラウザのCookieに保存されます。サーバー側にユーザーデータを永続的に保存することはありません。</p>

        <h2 className="text-lg font-semibold text-foreground pt-2">4. 第三者への提供</h2>
        <p>取得した情報を第三者に販売、貸与、または共有することはありません。ただし、AI分析機能の利用時に広告名等のデータがAnthropic社のAPIに送信されます。</p>

        <h2 className="text-lg font-semibold text-foreground pt-2">5. データの削除</h2>
        <p>ブラウザのCookieを削除することで、保存されたすべてのデータを削除できます。</p>

        <h2 className="text-lg font-semibold text-foreground pt-2">6. お問い合わせ</h2>
        <p>プライバシーに関するお問い合わせは、アプリ管理者までご連絡ください。</p>

        <p className="text-xs text-muted pt-4">最終更新日: 2026年4月8日</p>
      </div>
    </div>
  );
}
