import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getCurrentUser(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// DELETE 下架车源
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { id } = await params;
    const carSource = await prisma.carSource.findUnique({ where: { id } });
    if (!carSource) return NextResponse.json({ error: "车源不存在" }, { status: 404 });

    // 只有卖家本人或管理员可下架
    if (carSource.sellerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.carSource.update({ where: { id }, data: { status: "sold" } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("下架车源失败:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

// PATCH 更新车源
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { id } = await params;
    const carSource = await prisma.carSource.findUnique({ where: { id } });
    if (!carSource) return NextResponse.json({ error: "车源不存在" }, { status: 404 });
    if (carSource.sellerId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.year != null) updateData.year = Number(body.year);
    if (body.mileage != null) updateData.mileage = Number(body.mileage);
    if (body.price != null) updateData.price = Number(body.price);
    if (body.city) updateData.city = body.city;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.images) updateData.images = body.images;

    const updated = await prisma.carSource.update({
      where: { id },
      data: updateData,
      include: { model: { include: { brand: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("更新车源失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
