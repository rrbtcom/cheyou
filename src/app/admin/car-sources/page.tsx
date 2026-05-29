"use client";

import { useEffect, useState } from "react";

type CarSource = { id: string; year: number; mileage: number; price: number; city: string; status: string; description: string | null; model: { brand: { name: string }; name: string }; seller: { nickname: string | null; phone: string } };
type Model = { id: string; name: string; brand: { name: string } };

export default function CarSourcesAdmin() {
  const [sources, setSources] = useState<CarSource[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    fetch("/api/admin/car-sources").then(r => r.json()).then(setSources);
    fetch("/api/admin/models").then(r => r.json()).then(setModels);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">车源管理</h1>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left text-gray-500"><th className="py-2">车型</th><th>年份</th><th>里程(万km)</th><th>价格(万)</th><th>城市</th><th>卖家</th><th>状态</th></tr></thead>
        <tbody>
          {sources.map(s => (
            <tr key={s.id} className="border-b hover:bg-gray-50"><td className="py-2">{s.model.brand.name} {s.model.name}</td><td>{s.year}</td><td>{String(s.mileage)}</td><td className="text-red-600 font-medium">{String(s.price)}</td><td>{s.city}</td><td>{s.seller.nickname || s.seller.phone}</td><td><span className={`text-xs px-2 py-0.5 rounded ${s.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>{s.status}</span></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
