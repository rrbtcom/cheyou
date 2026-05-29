"use client";

import { useEffect, useState } from "react";

type Brand = { id: string; name: string };
type Model = { id: string; name: string; slug: string; level: string | null; priceMin: number; priceMax: number; evType: string | null; brand: Brand; _count?: { articles: number; carSources: number } };

export default function ModelsAdmin() {
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState({ brandId: "", name: "", level: "轿车", priceMin: "", priceMax: "", evType: "纯电" });

  useEffect(() => {
    fetch("/api/admin/models").then(r => r.json()).then(setModels);
    fetch("/api/admin/brands").then(r => r.json()).then(setBrands);
  }, []);

  const add = async () => {
    if (!form.brandId || !form.name) return;
    const slug = `${brands.find(b => b.id === form.brandId)?.name.toLowerCase()}-${form.name.toLowerCase()}`.replace(/\s+/g, "-");
    await fetch("/api/admin/models", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug, priceMin: parseFloat(form.priceMin) || null, priceMax: parseFloat(form.priceMax) || null }),
    });
    setForm({ brandId: "", name: "", level: "轿车", priceMin: "", priceMax: "", evType: "纯电" });
    fetch("/api/admin/models").then(r => r.json()).then(setModels);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">车型管理</h1>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 items-end">
          <div><label className="text-xs text-gray-500">品牌</label><select value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))} className="block border rounded px-2 py-2 w-full"><option value="">选择</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div><label className="text-xs text-gray-500">车型名</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="block border rounded px-2 py-2 w-full" /></div>
          <div><label className="text-xs text-gray-500">类型</label><select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="block border rounded px-2 py-2 w-full"><option>轿车</option><option>SUV</option><option>MPV</option></select></div>
          <div><label className="text-xs text-gray-500">最低价(万)</label><input value={form.priceMin} onChange={e => setForm(f => ({ ...f, priceMin: e.target.value }))} className="block border rounded px-2 py-2 w-full" /></div>
          <div><label className="text-xs text-gray-500">最高价(万)</label><input value={form.priceMax} onChange={e => setForm(f => ({ ...f, priceMax: e.target.value }))} className="block border rounded px-2 py-2 w-full" /></div>
          <div><label className="text-xs text-gray-500">动力</label><select value={form.evType} onChange={e => setForm(f => ({ ...f, evType: e.target.value }))} className="block border rounded px-2 py-2 w-full"><option>纯电</option><option>插混</option><option>增程</option><option>燃油</option></select></div>
        </div>
        <button onClick={add} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">添加车型</button>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left text-gray-500"><th className="py-2">品牌</th><th>车型</th><th>类型</th><th>动力</th><th>报价(万)</th><th>文章</th><th>车源</th></tr></thead>
        <tbody>
          {models.map(m => (
            <tr key={m.id} className="border-b hover:bg-gray-50"><td className="py-2">{m.brand.name}</td><td>{m.name}</td><td>{m.level || "-"}</td><td>{m.evType || "-"}</td><td>{m.priceMin}-{m.priceMax}</td><td>{m._count?.articles || 0}</td><td>{m._count?.carSources || 0}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
