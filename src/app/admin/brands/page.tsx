"use client";

import { useEffect, useState } from "react";

type Brand = { id: string; name: string; country: string | null; logoUrl: string | null; _count?: { models: number } };

export default function BrandsAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => { fetch("/api/admin/brands").then(r => r.json()).then(setBrands); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, country: country || null, logoUrl: null }) });
    setName(""); setCountry("");
    fetch("/api/admin/brands").then(r => r.json()).then(setBrands);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">品牌管理</h1>
      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex gap-3 items-end">
        <div><label className="text-xs text-gray-500">品牌名</label><input value={name} onChange={e => setName(e.target.value)} className="block border rounded px-3 py-2 w-40" placeholder="如：比亚迪" /></div>
        <div><label className="text-xs text-gray-500">国家</label><input value={country} onChange={e => setCountry(e.target.value)} className="block border rounded px-3 py-2 w-32" placeholder="如：中国" /></div>
        <button onClick={add} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">添加</button>
      </div>
      <table className="w-full border-collapse">
        <thead><tr className="border-b text-left text-sm text-gray-500"><th className="py-2">品牌名</th><th>国家</th><th>车型数</th></tr></thead>
        <tbody>
          {brands.map(b => (
            <tr key={b.id} className="border-b hover:bg-gray-50"><td className="py-2">{b.name}</td><td>{b.country || "-"}</td><td>{b._count?.models || 0}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
