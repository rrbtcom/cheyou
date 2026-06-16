"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

function formatPeriod(p: string) {
  // "2026-05" -> "2026年05月"
  if (/^\d{4}-\d{2}$/.test(p)) {
    return p.replace(/(\d{4})-(\d{2})/, "$1年$2月");
  }
  return p;
}

export default function MonthSelector({
  availableMonths,
  activePeriod,
}: {
  availableMonths: string[];
  activePeriod: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (availableMonths.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        暂无可选月份
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">选择月份：</span>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-gray-50 transition ${
            isPending ? "opacity-60" : ""
          }`}
        >
          <span>{activePeriod ? formatPeriod(activePeriod) : "选择月份"}</span>
          <svg className={"w-4 h-4 text-gray-400 transition-transform " + (open ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            {/* 点击遮罩关闭 */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            {/* 下拉列表 */}
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border rounded-lg shadow-lg w-44 max-h-72 overflow-y-auto">
              {availableMonths.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setOpen(false);
                    startTransition(() => {
                      router.push(p === availableMonths[0] ? pathname : `${pathname}?month=${p}`);
                    });
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition ${
                    p === activePeriod
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  } ${p === availableMonths[0] ? "border-b" : ""}`}
                >
                  {formatPeriod(p)}
                  {p === availableMonths[0] && (
                    <span className="ml-2 text-xs text-blue-400">最新</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {isPending && (
        <span className="text-xs text-gray-400 animate-pulse">加载中...</span>
      )}
    </div>
  );
}
