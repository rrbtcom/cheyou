"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const platforms = [
  { value: "", label: "无" },
  { value: "wechat", label: "微信公众号" },
  { value: "douyin", label: "抖音" },
  { value: "xiaohongshu", label: "小红书" },
];

export default function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [clubId, setClubId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", city: "", brand: "",
    sourcePlatform: "", sourceUrl: "", sourceId: "", avatar: "", description: "", status: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setClubId(id);
      fetch(`/api/admin/clubs/${id}`)
        .then(r => r.json())
        .then(c => {
          setForm({
            name: c.name || "", slug: c.slug || "", city: c.city || "", brand: c.brand || "",
            sourcePlatform: c.sourcePlatform || "", sourceUrl: c.sourceUrl || "",
            sourceId: c.sourceId || "", avatar: c.avatar || "", description: c.description || "",
            status: c.status || "active",
          });
          setLoading(false);
        });
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/admin/clubs");
      } else {
        const err = await res.json();
        alert("保存失败: " + (err.message || JSON.stringify(err)));
      }
    } catch (err) {
      alert("保存失败: " + err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8">加载中...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">编辑车友会</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
          <input type="text" required value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input type="text" value={form.slug}
            onChange={e => setForm({...form, slug: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <input type="text" value={form.city}
              onChange={e => setForm({...form, city: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <input type="text" value={form.brand}
              onChange={e => setForm({...form, brand: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-2sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源平台</label>
            <select value={form.sourcePlatform}
              onChange={e => setForm({...form, sourcePlatform: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select value={form.status}
              onChange={e => setForm({...form, status: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="pending">待审核</option>
              <option value="active">已通过</option>
              <option value="banned">已拒绝</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">原始链接</label>
          <input type="url" value={form.sourceUrl}
            onChange={e => setForm({...form, sourceUrl: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">头像URL</label>
          <input type="url" value={form.avatar}
            onChange={e => setForm({...form, avatar: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
          <textarea value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "保存中..." : "保存修改"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
        </div>
      </form>
    </div>
  );
}
