import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取当前登录用户
async function getCurrentUser(req: Request) {
  const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

// POST 发布二手车源
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const body = await req.json();
    const { modelId, year, mileage, price, city, description, images } = body;

    if (!modelId || !year || mileage == null || !price || !city) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // 验证车型存在
    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) return NextResponse.json({ error: "车型不存在" }, { status: 404 });

    const carSource = await prisma.carSource.create({
      data: {
        modelId,
        sellerId: user.id,
        year: Number(year),
        mileage: Number(mileage),
        price: Number(price),
        city,
        description: description || null,
        images: images || [],
        status: "active",
        publishedAt: new Date(),
      },
      include: { model: { include: { brand: true } } },
    });

    return NextResponse.json(carSource, { status: 201 });
  } catch (error) {
    console.error("发布车源失败:", error);
    return NextResponse.json({ error: "发布失败，请重试" }, { status: 500 });
  }
}

// GET 获取我的车源
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine");

    if (mine === "1") {
      const carSources = await prisma.carSource.findMany({
        where: { sellerId: user.id },
        include: { model: { include: { brand: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(carSources);
    }

    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  } catch (error) {
    console.error("获取车源失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
