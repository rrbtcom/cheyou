"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const SOURCE_LABELS: Record<string, string> = {
  all: "全部来源",
  caam: "中汽协",
  pca: "乘联会",
  cadt: "中汽中心",
};
const SOURCE_COLORS: Record<string, string> = {
  all: "bg-gray-100 text-gray-700 border-gray-200",
  caam: "bg-blue-50 text-blue-600 border-blue-200",
  pca: "bg-green-50 text-green-700 border-green-200",
  cadt: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function SourceSelector({
  allSources,
  activeSource,
}: {
  allSources: string[];
  activeSource: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const options = ["all", ...allSources.filter((s) => s !== "all")];

  function navigate(val: string) {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("source", val);
      router.push(pathname + "?" + params.toString());
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => navigate(opt)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            activeSource === opt
              ? SOURCE_COLORS[opt] + " ring-1 ring-inset ring-black/10"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {SOURCE_LABELS[opt] || opt}
        </button>
      ))}
    </div>
  );
}
