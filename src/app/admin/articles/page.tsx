"use client";

import { useEffect, useState } from "react";

type Article = { id: string; title: string; slug: string; type: string; author: string; publishedAt: string | null; model: { brand: Brand; name: string } | null };
type Brand = { name: string };
type Model = { id: string; name: string; brand: Brand };

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [form, setForm] = useState({ title: "", slug: "", content: "", type: "news", modelId: "" });

  useEffect(() => {
    fetch("/api/admin/articles").then(r => r.json()).then(setArticles);
    fetch("/api/admin/models").then(r => r.json()).then(setModels);
  }, []);

  const add = async () => {
    if (!form.title || !form.slug) return;
    await fetch("/api/admin/articles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, modelId: form.modelId || null, author: "车友荟编辑部" }),
    });
    setForm({ title: "", slug: "", content: "", type: "news", modelId: "" });
    fetch("/api/admin/articles").then(r => r.json()).then(setArticles);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">资讯管理</h1>
      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500">标题</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="block border rounded px-2 py-2 w-full" /></div>
          <div><label className="text-xs text-gray-500">Slug</label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="block border rounded px-2 py-2 w-full" placeholder="如：byd-han-ev-review" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500">类型</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="block border rounded px-2 py-2 w-full"><option value="news">新闻</option><option value="review">评测</option><option value="guide">导购</option></select></div>
          <div><label className="text-xs text-gray-500">关联车型</label><select value={form.modelId} onChange={e => setForm(f => ({ ...f, modelId: e.target.value }))} className="block border rounded px-2 py-2 w-full"><option value="">无</option>{models.map(m => <option key={m.id} value={m.id}>{m.brand.name} {m.name}</option>)}</select></div>
        </div>
        <div><label className="text-xs text-gray-500">内容</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="block border rounded px-2 py-2 w-full h-24" /></div>
        <button onClick={add} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">发布文章</button>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left text-gray-500"><th className="py-2">标题</th><th>类型</th><th>关联车型</th><th>发布时间</th></tr></thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.id} className="border-b hover:bg-gray-50"><td className="py-2">{a.title}</td><td>{a.type}</td><td>{a.model ? `${a.model.brand.name} ${a.model.name}` : "-"}</td><td>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("zh-CN") : "草稿"}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
