"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, nickname: nickname || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      // 注册成功后自动登录
      const loginRes = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      if (loginRes.ok) { router.push("/"); router.refresh(); }
      else { router.push("/auth/login"); }
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">注册车友荟</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-500">手机号</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="block w-full border rounded-lg px-3 py-2.5 mt-1" placeholder="13800138000" required />
        </div>
        <div>
          <label className="text-sm text-gray-500">昵称（选填）</label>
          <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="block w-full border rounded-lg px-3 py-2.5 mt-1" placeholder="你的昵称" />
        </div>
        <div>
          <label className="text-sm text-gray-500">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full border rounded-lg px-3 py-2.5 mt-1" placeholder="至少6位" required />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "注册中..." : "注册"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-6">
        已有账号？<a href="/auth/login" className="text-blue-600 hover:underline">去登录</a>
      </p>
    </div>
  );
}
