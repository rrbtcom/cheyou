import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import PKCompare from "./PKCompare";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "车型PK",
  description: "车型参数对比，选车更轻松。两款车型全方位PK，续航、动力、空间、智能一目了然。",
};

export default async function PKPage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const { left, right } = await searchParams;

  // Fetch both models if slugs provided
  const leftModel = left
    ? await prisma.model.findUnique({
        where: { slug: left },
        include: { brand: true },
      })
    : null;

  const rightModel = right
    ? await prisma.model.findUnique({
        where: { slug: right },
        include: { brand: true },
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">车型PK</h1>
        <p className="text-gray-500">选择两款车型，全方位参数对比，选车更轻松</p>
      </div>

      <PKCompare leftModel={leftModel} rightModel={rightModel} />

      {/* 快捷PK入口 */}
      {!leftModel && !rightModel && <QuickPicks />}
    </div>
  );
}

function QuickPicks() {
  const pairs = [
    { left: "byd-han-ev", right: "tesla-model-3", label: "比亚迪汉 vs 特斯拉Model 3" },
    { left: "nio-et5", right: "tesla-model-3", label: "蔚来ET5 vs 特斯拉Model 3" },
    { left: "xpeng-g6", right: "tesla-model-y", label: "小鹏G6 vs 特斯拉Model Y" },
    { left: "byd-seal", right: "tesla-model-3", label: "比亚迪海豹 vs 特斯拉Model 3" },
    { left: "lixiang-l7", right: "lixiang-l9", label: "理想L7 vs 理想L9" },
    { left: "zeekr-001", right: "byd-han-ev", label: "极氪001 vs 比亚迪汉" },
  ];

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-gray-900 mb-4">热门对比</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pairs.map((p) => (
          <Link
            key={p.left + p.right}
            href={`/pk?left=${p.left}&right=${p.right}`}
            className="flex items-center justify-center gap-3 p-4 border rounded-lg hover:shadow-md hover:border-blue-300 transition"
          >
            <span className="text-sm font-medium text-gray-700">{p.label}</span>
            <span className="text-blue-600">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
