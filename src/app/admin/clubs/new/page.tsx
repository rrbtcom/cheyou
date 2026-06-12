"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const platforms = [
  { value: "", label: "无" },
  { value: "wechat", label: "微信公众号" },
  { value: "douyin", label: "抖音" },
  { value: "xiaohongshu", label: "小红书" },
];

export default function NewClubPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    brand: "",
    sourcePlatform: "",
    sourceUrl: "",
    sourceId: "",
    avatar: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/admin/clubs");
      } else {
        const err = await res.json();
        alert("创建失败: " + (err.message || JSON.stringify(err)));
      }
    } catch (err) {
      alert("创建失败: " + err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">添加车友会</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="如：比亚迪汉车友会"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug（留空自动生成）</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="byd-han-club"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="北京"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="比亚迪"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源平台</label>
            <select
              value={form.sourcePlatform}
              onChange={(e) => setForm({ ...form, sourcePlatform: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">平台原始ID</label>
            <input
              type="text"
              value={form.sourceId}
              onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">原始链接</label>
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">头像URL</label>
          <input
            type="url"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "创建中..." : "创建车友会"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
