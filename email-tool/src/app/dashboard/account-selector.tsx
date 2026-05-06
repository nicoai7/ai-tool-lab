"use client";

import { useState, useEffect } from "react";

interface Account {
  id: string;
  gmail_email: string;
  account_name: string;
}

interface AccountSelectorProps {
  selectedAccountIds: string[];
  onChangeSelection: (ids: string[]) => void;
}

export function AccountSelector({ selectedAccountIds, onChangeSelection }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/email/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
        // 初回：全アカウントを選択
        if (data.accounts.length > 0 && selectedAccountIds.length === 0) {
          onChangeSelection(data.accounts.map((a: Account) => a.id));
        }
      }
    } catch {
      // エラーは無視
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const addAccount = () => {
    window.location.href = "/email/api/accounts/add";
  };

  const removeAccount = async (id: string) => {
    if (!confirm("このアカウントを削除しますか？")) return;
    const res = await fetch("/email/api/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const remaining = accounts.filter((a) => a.id !== id);
      setAccounts(remaining);
      onChangeSelection(selectedAccountIds.filter((sid) => sid !== id));
    }
  };

  const toggleAccount = (id: string) => {
    if (selectedAccountIds.includes(id)) {
      // 最低1つは選択を維持
      if (selectedAccountIds.length <= 1) return;
      onChangeSelection(selectedAccountIds.filter((sid) => sid !== id));
    } else {
      onChangeSelection([...selectedAccountIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedAccountIds.length === accounts.length) {
      // 全選択中 → 最初の1つだけ残す
      onChangeSelection([accounts[0].id]);
    } else {
      onChangeSelection(accounts.map((a) => a.id));
    }
  };

  const allSelected = selectedAccountIds.length === accounts.length;

  // 表示ラベル
  const label = (() => {
    if (accounts.length === 0) return "アカウント選択";
    if (allSelected) return `全アカウント (${accounts.length})`;
    if (selectedAccountIds.length === 1) {
      const acc = accounts.find((a) => a.id === selectedAccountIds[0]);
      return acc?.gmail_email || "1アカウント";
    }
    return `${selectedAccountIds.length}アカウント選択中`;
  })();

  if (loading) {
    return <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-[#202124] transition hover:bg-slate-50"
      >
        {allSelected ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#34A853] text-[10px] font-bold text-white">
            All
          </div>
        ) : (
          <div className="flex -space-x-1.5">
            {selectedAccountIds.slice(0, 3).map((id) => {
              const acc = accounts.find((a) => a.id === id);
              return (
                <div key={id} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a73e8] text-[10px] font-bold text-white ring-2 ring-white">
                  {(acc?.gmail_email || "?")[0].toUpperCase()}
                </div>
              );
            })}
          </div>
        )}
        <span className="max-w-[200px] truncate">{label}</span>
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 z-50 mt-1 w-80 rounded-xl bg-white py-2 shadow-lg ring-1 ring-slate-200">
            <div className="px-3 pb-2 pt-1 text-xs font-medium text-[#5f6368]">
              表示するアカウントを選択
            </div>

            {/* 全選択/解除 */}
            {accounts.length >= 2 && (
              <button
                onClick={toggleAll}
                className="flex w-full items-center gap-3 px-3 py-2 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  readOnly
                  className="h-4 w-4 rounded border-slate-300 text-[#34A853] accent-[#34A853]"
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#34A853] text-[10px] font-bold text-white">
                  All
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-[#202124]">すべて選択</div>
                  <div className="text-xs text-[#5f6368]">{accounts.length}アカウント</div>
                </div>
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            {/* 各アカウント */}
            {accounts.map((account) => {
              const isChecked = selectedAccountIds.includes(account.id);
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between px-3 py-2 transition hover:bg-slate-50"
                >
                  <button
                    onClick={() => toggleAccount(account.id)}
                    className="flex flex-1 items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="h-4 w-4 rounded border-slate-300 text-[#1a73e8] accent-[#1a73e8]"
                    />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-bold text-white">
                      {account.gmail_email[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-[#202124]">
                        {account.account_name}
                      </div>
                      <div className="text-xs text-[#5f6368]">
                        {account.gmail_email}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAccount(account.id);
                    }}
                    className="ml-2 rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                    title="削除"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}

            <div className="mt-1 border-t border-slate-100 pt-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  addAccount();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#1a73e8] transition hover:bg-slate-50"
              >
                <div className="h-4 w-4" />
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400">
                  +
                </span>
                別のGmailアカウントを追加
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
