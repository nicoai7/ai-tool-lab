'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface ExportButtonProps {
  onCSV: () => void;
  onExcel?: () => void;
  onPptx?: () => void;
  onBulk?: () => void;
}

export default function ExportButton({ onCSV, onExcel, onPptx, onBulk }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleMouse);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const hasDropdown = onExcel || onPptx || onBulk;

  if (!hasDropdown) {
    return (
      <button
        onClick={onCSV}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
      >
        <Download size={14} />
        CSV出力
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
      >
        <Download size={14} />
        出力
        <ChevronDown size={12} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors rounded-t-lg"
          >
            📄 CSV出力
          </button>
          {onExcel && (
            <button
              onClick={() => { onExcel(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-t border-border"
            >
              📊 Excel出力（.xlsx）
            </button>
          )}
          {onPptx && (
            <button
              onClick={() => { onPptx(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-t border-border"
            >
              📑 PowerPoint出力（.pptx）
            </button>
          )}
          {onBulk && (
            <button
              onClick={() => { onBulk(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-t border-border rounded-b-lg font-medium text-primary"
            >
              📦 全レポート一括出力
            </button>
          )}
        </div>
      )}
    </div>
  );
}
