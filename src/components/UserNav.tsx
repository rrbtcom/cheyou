"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type User = { id: string; phone: string; nickname: string | null; role: string } | null;

export default function UserNav() {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(setUser).catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">👋 {user.nickname || user.phone}</span>
        {user.role === "admin" && <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">管理</Link>}
        <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500">退出</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600">登录</Link>
      <Link href="/auth/register" className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">注册</Link>
    </div>
  );
}
