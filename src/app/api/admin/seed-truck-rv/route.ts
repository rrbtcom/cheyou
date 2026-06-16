import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TRUCK_CLUBS = [
  { name: "解放车友会", slug: "jiefang-truck", brand: "一汽解放", category: "truck", city: "全国", description: "一汽解放商用车车友交流社区" },
  { name: "东风商用车车友会", slug: "dongfeng-truck", brand: "东风商用车", category: "truck", city: "全国", description: "东风商用车用户社区" },
  { name: "重火车友会", slug: "sinotruk-truck", brand: "中国重汽", category: "truck", city: "全国", description: "中国重汽豪沃/汕德卡用户社区" },
  { name: "陕汽重卡社区", slug: "shaanxi-truck", brand: "陕汽重卡", category: "truck", city: "全国", description: "陕汽德龙/奥龙用户社区" },
  { name: "福田卡车车友", slug: "foton-truck", brand: "福田汽车", category: "truck", city: "全国", description: "福田欧曼/欧马可/奥铃用户社区" },
  { name: "江淮格尔发社区", slug: "jAC-truck", brand: "江淮格尔发", category: "truck", city: "全国", description: "江淮格尔发卡车用户社区" },
  { name: "三一重卡俱乐部", slug: "sany-truck", brand: "三一重卡", category: "truck", city: "全国", description: "三一重卡用户交流社区" },
  { name: "徐工重卡社区", slug: "xcmg-truck", brand: "徐工重卡", category: "truck", city: "全国", description: "徐工重卡用户社区" },
  { name: "上汽红岩车友会", slug: "hongyan-truck", brand: "上汽红岩", category: "truck", city: "全国", description: "上汽红岩杰狮/杰虎用户社区" },
  { name: "柳汽乘龙社区", slug: "liuzhou-truck", brand: "东风柳汽乘龙", category: "truck", city: "广西柳州", description: "东风柳汽乘龙H7/T5用户社区" },
];

const RV_CLUBS = [
  { name: "长城房车俱乐部", slug: "greatwall-rv", brand: "长城汽车", category: "rv", city: "全国", description: "长城览众/风骏房车用户社区" },
  { name: "上汽大通房车社区", slug: "maxus-rv", brand: "上汽大通", category: "rv", city: "全国", description: "上汽大通RV80/生活家V90用户社区" },
  { name: "金冠房车俱乐部", slug: "jinguang-rv", brand: "金冠汽车", category: "rv", city: "全国", description: "金冠汽车房车用户社区" },
  { name: "宇通房车车友会", slug: "yutong-rv", brand: "宇通客车", category: "rv", city: "全国", description: "宇通C型/B型房车用户社区" },
  { name: "江铃旅居车社区", slug: "jmc-rv", brand: "江铃旅居车", category: "rv", city: "全国", description: "江铃旅居车用户社区" },
  { name: "旌航房车俱乐部", slug: "jinghang-rv", brand: "旌航汽车", category: "rv", city: "全国", description: "旌航房车用户社区" },
  { name: "法美瑞房车社区", slug: "fameirui-rv", brand: "法美瑞", category: "rv", city: "全国", description: "法美瑞房车用户社区" },
  { name: "戴德房车俱乐部", slug: "dadicamp-rv", brand: "戴德汽车", category: "rv", city: "全国", description: "戴德房车用户社区" },
  { name: "览众房车社区", slug: "lazhong-rv", brand: "览众科技", category: "rv", city: "全国", description: "览众风骏C7/C6房车用户社区" },
  { name: "新星房车俱乐部", slug: "newstar-rv", brand: "新星汽车", category: "rv", city: "全国", description: "新星房车用户社区" },
];

export async function POST() {
  try {
    let added = 0, skipped = 0;
    const allClubs = [...TRUCK_CLUBS, ...RV_CLUBS];
    
    for (const club of allClubs) {
      const existing = await prisma.club.findUnique({ where: { slug: club.slug } });
      if (existing) { skipped++; continue; }
      await prisma.club.create({
        data: { ...club, status: "active", isAutoCreated: true },
      });
      added++;
    }

    const total = await prisma.club.count();
    const truckCount = await prisma.club.count({ where: { category: "truck" } });
    const rvCount = await prisma.club.count({ where: { category: "rv" } });

    return NextResponse.json({ ok: true, added, skipped, total, truckCount, rvCount });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
