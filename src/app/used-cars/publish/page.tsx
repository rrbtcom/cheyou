"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ModelItem {
  id: string;
  name: string;
  slug: string;
  brand: { name: string };
}

interface UserInfo {
  id: string;
  phone: string;
  nickname: string | null;
  role: string;
}

export default function PublishCarPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [search, setSearch] = useState("");
  const [showModelList, setShowModelList] = useState(false);
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(u => {
      if (!u?.id) router.push("/auth/login");
      else setUser(u);
    });
    fetch("/api/models").then(r => r.json()).then(d => setModels(d.models || d || []));
  }, [router]);

  const filtered = search.length > 0
    ? models.filter((m: ModelItem) =>
        `${m.brand.name} ${m.name}`.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20)
    : [];

  const selectModel = (m: ModelItem) => {
    setModelId(m.id);
    setModelName(`${m.brand.name} ${m.name}`);
    setSearch("");
    setShowModelList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId || !year || !mileage || !price || !city) {
      alert("请填写所有必填项");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/car-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, year: Number(year), mileage, price, city, description, images: [] }),
      });
      if (res.ok) {
        alert("发布成功！");
        router.push("/used-cars/my");
      } else {
        const data = await res.json();
        alert(data.error || "发布失败");
      }
    } catch {
      alert("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">加载中...</div>;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-600">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/used-cars" className="hover:text-blue-600">二手车</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">发布车源</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">发布二手车源</h1>
      <p className="text-gray-500 mb-6 text-sm">纯信息撮合，买卖双方直接对接，无中间商</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">车型 <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input type="text" placeholder={modelName || "搜索车型，如：比亚迪海鸥"}
              value={search || (modelName || "")}
              onChange={(e) => { setSearch(e.target.value); setModelId(""); setModelName(""); setShowModelList(true); }}
              onFocus={() => { if (!modelId) setShowModelList(true); }}
              className="flex-1 border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            {modelId && (
              <button type="button" onClick={() => { setModelId(""); setModelName(""); setSearch(""); }}
                className="text-gray-400 hover:text-red-500 px-2">✕</button>
            )}
          </div>
          {showModelList && filtered.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filtered.map((m: ModelItem) => (
                <button key={m.id} type="button" onClick={() => selectModel(m)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm border-b last:border-b-0">
                  <span className="text-gray-400 mr-2">{m.brand.name}</span>
                  <span className="font-medium">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">上牌年份 <span className="text-red-500">*</span></label>
          <select value={year} onChange={(e) => setYear(e.target.value)} required
            className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">请选择</option>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表显里程（万公里）<span className="text-red-500">*</span></label>
            <input type="number" step="0.1" min="0" value={mileage} onChange={(e) => setMileage(e.target.value)} required placeholder="如 3.5"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">售价（万元）<span className="text-red-500">*</span></label>
            <input type="number" step="0.1" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="如 15.8"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">所在城市 <span className="text-red-500">*</span></label>
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="如：北京"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">车辆描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="车况描述，如：全程4S店保养、无事故无水泡、配置说明等"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-700">
          ⚠️ 发布须知：车友荟仅提供信息撮合平台，不参与交易。请如实描述车况，见面验车交易，不提前转账。
        </div>

        <button type="submit" disabled={loading || !modelId}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {loading ? "发布中..." : "发布车源"}
        </button>
      </form>
    </div>
  );
}
