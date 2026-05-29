"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CarSourceItem {
  id: string;
  year: number;
  mileage: number;
  price: number;
  city: string;
  description: string | null;
  status: string;
  createdAt: string;
  model: { name: string; slug: string; imageUrl: string | null; brand: { name: string } };
}

interface UserInfo {
  id: string;
  phone: string;
  nickname: string | null;
}

export default function MyCarsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [cars, setCars] = useState<CarSourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(u => {
      if (!u?.id) { router.push("/auth/login"); return; }
      setUser(u);
      fetch("/api/car-sources?mine=1").then(r => r.json()).then(d => {
        setCars(Array.isArray(d) ? d : []);
        setLoading(false);
      });
    });
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定下架该车源？")) return;
    const res = await fetch(`/api/car-sources/${id}`, { method: "DELETE" });
    if (res.ok) setCars(cars.filter(c => c.id !== id));
    else alert("操作失败");
  };

  if (!user || loading) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-600">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/used-cars" className="hover:text-blue-600">二手车</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">我的车源</span>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的车源</h1>
        <Link href="/used-cars/publish"
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
          + 发布新车源
        </Link>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-4">还没有发布过车源</p>
          <Link href="/used-cars/publish" className="text-blue-600 hover:underline">去发布 →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cars.map((cs) => (
            <div key={cs.id} className="border rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {cs.model.brand.name} {cs.model.name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    cs.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {cs.status === "active" ? "在售" : cs.status === "sold" ? "已下架" : cs.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex gap-3">
                  <span>{cs.year}年</span>
                  <span>{cs.mileage}万公里</span>
                  <span>📍{cs.city}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-red-600 font-bold text-lg">{cs.price}万</p>
                <p className="text-xs text-gray-400">{new Date(cs.createdAt).toLocaleDateString("zh-CN")}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {cs.status === "active" && (
                  <Link href={`/used-cars/${cs.id}`}
                    className="text-xs text-blue-600 hover:underline">查看</Link>
                )}
                {cs.status === "active" && (
                  <button onClick={() => handleDelete(cs.id)}
                    className="text-xs text-red-500 hover:underline">下架</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
