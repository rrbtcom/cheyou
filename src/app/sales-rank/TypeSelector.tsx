"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

const TYPES = [
  { key: "all", label: "全部" },
  { key: "sedan", label: "轿车" },
  { key: "suv", label: "SUV" },
  { key: "mpv", label: "MPV" },
  { key: "microvan", label: "微面" },
  { key: "rv", label: "房车" },
];

export default function TypeSelector({ activeType }: { activeType: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigate(key: string) {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("type", key);
      router.push(pathname + "?" + params.toString());
    });
  }

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {TYPES.map((t) => (
        <button
          key={t.key}
          onClick={() => navigate(t.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
            activeType === t.key
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
