"use client";

import { useState } from "react";
import { AccountSelector } from "./account-selector";
import { EmailDashboard } from "./email-dashboard";

export function DashboardClient() {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  return (
    <div>
      {/* アカウント切り替え */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-[#5f6368]">分析するアカウント:</span>
        <AccountSelector
          selectedAccountIds={selectedAccountIds}
          onChangeSelection={setSelectedAccountIds}
        />
      </div>

      {/* メールダッシュボード */}
      <EmailDashboard selectedAccountIds={selectedAccountIds} />
    </div>
  );
}
