import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "后台管理", robots: { index: false } };

const modules = [
  { name: "品牌管理", href: "/admin/brands", desc: "管理汽车品牌信息", icon: "🏭" },
  { name: "车型管理", href: "/admin/models", desc: "管理车型数据和报价", icon: "🚗" },
  { name: "资讯管理", href: "/admin/articles", desc: "发布和管理文章", icon: "📰" },
  { name: "车源管理", href: "/admin/car-sources", desc: "审核和管理二手车源", icon: "💰" },
];

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">后台管理</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="border rounded-lg p-5 hover:shadow-md transition flex items-start gap-4">
            <span className="text-3xl">{m.icon}</span>
            <div>
              <h2 className="font-semibold text-lg">{m.name}</h2>
              <p className="text-sm text-gray-500">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
