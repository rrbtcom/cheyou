import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const model = await prisma.model.findUnique({ where: { slug }, include: { brand: true } });
  if (!model) return { title: "车型未找到" };
  return {
    title: `${model.brand.name} ${model.name} - 报价/参数/图片/资讯`,
    description: `${model.brand.name} ${model.name}，${model.evType || ""}车型，${model.priceMin && model.priceMax ? `售价${model.priceMin}-${model.priceMax}万元` : ""}${model.rangeCLTC ? `，续航${model.rangeCLTC}km` : ""}。查看详细参数配置、用户口碑、相关资讯与二手车源。`,
  };
}

function s(v: any) {
  if (v == null) return null;
  const str = String(v);
  // Fix Decimal precision artifacts like 85.40000000000001
  const num = Number(str);
  return isNaN(num) ? str : String(Math.round(num * 100) / 100);
}
function ParamRow({ label, value, unit }: { label: string; value: string | null; unit?: string }) {
  if (!value) return null;
  return <div className="border-b py-2.5 flex justify-between"><span className="text-gray-400">{label}</span><span className="font-medium">{value}{unit || ""}</span></div>;
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const model = await prisma.model.findUnique({
    where: { slug },
    include: { brand: true, articles: { where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: 10 },
      carSources: { where: { status: "active" }, orderBy: { publishedAt: "desc" }, include: { seller: true } } },
  });
  if (!model) notFound();

  const siblings = await prisma.model.findMany({ where: { brandId: model.brandId, id: { not: model.id }, status: "active" }, include: { brand: true }, take: 6 });
  const competitors = await prisma.model.findMany({
    where: { id: { not: model.id }, status: "active", level: model.level, evType: model.evType,
      priceMin: { gte: Number(model.priceMin) * 0.7, lte: Number(model.priceMax) * 1.3 } },
    include: { brand: true }, take: 6,
  });

  const isEV = model.evType !== "燃油";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-600">首页</Link><span className="mx-1">/</span>
        <Link href="/new-cars" className="hover:text-blue-600">新车资讯</Link><span className="mx-1">/</span>
        <span className="text-gray-600">{model.brand.name} {model.name}</span>
      </nav>

      {/* 头部 */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 h-64 bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                {model.imageUrl ? (
                  <Image src={model.imageUrl} alt={`${model.brand.name} ${model.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                ) : (
                  <span className="text-gray-300 text-lg">{model.brand.name} {model.name}</span>
                )}
              </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {model.evType && <span className={`text-xs px-2 py-0.5 rounded ${model.evType === "纯电" ? "bg-green-50 text-green-700" : model.evType === "插混" ? "bg-blue-50 text-blue-700" : model.evType === "增程" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{model.evType}</span>}
              {model.level && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{model.level}</span>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{model.brand.name} {model.name}</h1>
            <p className="text-sm text-gray-400 mb-4">品牌：{model.brand.name}（{model.brand.country || "未知"}）</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-red-600">{s(model.priceMin) && s(model.priceMax) ? `${s(model.priceMin)}-${s(model.priceMax)}` : "暂无报价"}</span>
              {s(model.priceMin) && <span className="text-lg text-red-400 ml-1">万</span>}
            </div>
            {/* 核心亮点 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {model.rangeCLTC && <div className="bg-green-50 rounded p-3"><span className="text-green-500">续航</span><p className="font-bold text-green-700 mt-0.5">{s(model.rangeCLTC)}km</p></div>}
              {model.acceleration && <div className="bg-red-50 rounded p-3"><span className="text-red-400">零百</span><p className="font-bold text-red-600 mt-0.5">{s(model.acceleration)}s</p></div>}
              {model.batteryCapacity && <div className="bg-blue-50 rounded p-3"><span className="text-blue-400">电池</span><p className="font-bold text-blue-600 mt-0.5">{s(model.batteryCapacity)}kWh</p></div>}
              {model.chargeFast && <div className="bg-yellow-50 rounded p-3"><span className="text-yellow-500">快充</span><p className="font-bold text-yellow-700 mt-0.5">{s(model.chargeFast)}min</p></div>}
            </div>
            <div className="mt-4 flex gap-3">
              <Link href={`/used-cars?model=${model.id}`} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">查看二手车源</Link>
              <Link href={`/pk?left=${model.slug}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">加入PK ⚔️</Link>
            </div>
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Car", "name": `${model.brand.name} ${model.name}`, "brand": { "@type": "Brand", "name": model.brand.name }, "vehicleModelDate": model.evType, "offers": s(model.priceMin) && s(model.priceMax) ? { "@type": "AggregateOffer", "lowPrice": s(model.priceMin), "highPrice": s(model.priceMax), "priceCurrency": "CNY" } : undefined }) }} />

      {/* 基本参数 */}
      <section className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">基本参数</h2>
        <div className="divide-y text-sm">
          <ParamRow label="品牌" value={model.brand.name} />
          <ParamRow label="车型" value={model.name} />
          <ParamRow label="级别" value={model.level} />
          <ParamRow label="动力类型" value={model.evType} />
          <ParamRow label="指导价" value={s(model.priceMin) && s(model.priceMax) ? `${s(model.priceMin)}-${s(model.priceMax)}万` : null} />
          <ParamRow label="状态" value={model.status === "active" ? "在售" : "停售"} />
        </div>
      </section>

      {/* 动力系统 */}
      <section className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">动力系统</h2>
        <div className="divide-y text-sm">
          {isEV ? (
            <>
              <ParamRow label="电机类型" value={model.motorType} />
              <ParamRow label="最大功率" value={s(model.motorPower)} unit="kW" />
              <ParamRow label="最大扭矩" value={s(model.motorTorque)} unit="N·m" />
              <ParamRow label="电池容量" value={s(model.batteryCapacity)} unit="kWh" />
              <ParamRow label="电池类型" value={model.batteryType} />
              <ParamRow label="CLTC续航" value={s(model.rangeCLTC)} unit="km" />
              <ParamRow label="WLTC续航" value={s(model.rangeWLTC)} unit="km" />
              <ParamRow label="0-100km/h" value={s(model.acceleration)} unit="秒" />
              <ParamRow label="最高车速" value={s(model.topSpeed)} unit="km/h" />
            </>
          ) : (
            <>
              <ParamRow label="发动机功率" value={s(model.enginePower)} unit="kW" />
              <ParamRow label="发动机扭矩" value={s(model.engineTorque)} unit="N·m" />
              <ParamRow label="燃油标号" value={model.fuelType} />
              <ParamRow label="综合油耗" value={s(model.fuelConsumption)} unit="L/100km" />
              <ParamRow label="0-100km/h" value={s(model.acceleration)} unit="秒" />
              <ParamRow label="最高车速" value={s(model.topSpeed)} unit="km/h" />
            </>
          )}
          {model.evType === "插混" || model.evType === "增程" ? (
            <>
              <ParamRow label="电机功率" value={s(model.motorPower)} unit="kW" />
              <ParamRow label="电机扭矩" value={s(model.motorTorque)} unit="N·m" />
              <ParamRow label="电池容量" value={s(model.batteryCapacity)} unit="kWh" />
              <ParamRow label="纯电续航" value={s(model.rangeCLTC)} unit="km" />
            </>
          ) : null}
        </div>
      </section>

      {/* 充电（纯电/插混/增程） */}
      {isEV && (model.chargeFast || model.chargeSlow || model.chargePower) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">充电参数</h2>
          <div className="divide-y text-sm">
            <ParamRow label="平台电压" value={model.voltage} />
            <ParamRow label="最大充电功率" value={s(model.chargePower)} unit="kW" />
            <ParamRow label="快充(30%-80%)" value={s(model.chargeFast)} unit="分钟" />
            <ParamRow label="慢充" value={s(model.chargeSlow)} unit="小时" />
          </div>
        </section>
      )}

      {/* 车身尺寸 */}
      {(model.length || model.width || model.height || model.wheelbase) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">车身尺寸</h2>
          <div className="divide-y text-sm">
            <ParamRow label="长×宽×高" value={s(model.length) && s(model.width) && s(model.height) ? `${s(model.length)}×${s(model.width)}×${s(model.height)}` : null} unit="mm" />
            <ParamRow label="轴距" value={s(model.wheelbase)} unit="mm" />
            <ParamRow label="整备质量" value={s(model.weight)} unit="kg" />
            <ParamRow label="座位数" value={model.seats ? String(model.seats) : null} />
            <ParamRow label="后备箱容积" value={s(model.trunkVolume)} unit="L" />
          </div>
        </section>
      )}

      {/* 底盘悬挂 */}
      {(model.driveMode || model.suspensionF || model.suspensionR) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">底盘悬挂</h2>
          <div className="divide-y text-sm">
            <ParamRow label="驱动方式" value={model.driveMode} />
            <ParamRow label="前悬挂" value={model.suspensionF} />
            <ParamRow label="后悬挂" value={model.suspensionR} />
          </div>
        </section>
      )}

      {/* 智能配置 */}
      {(model.chip || model.adasLevel || model.screen) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">智能配置</h2>
          <div className="divide-y text-sm">
            <ParamRow label="智驾芯片" value={model.chip} />
            <ParamRow label="辅助驾驶" value={model.adasLevel} />
            <ParamRow label="中控屏" value={model.screen} />
            <ParamRow label="CarPlay" value={model.carPlay ? "支持" : model.carPlay === false ? "不支持" : null} />
            <ParamRow label="OTA升级" value={model.ota ? "支持" : model.ota === false ? "不支持" : null} />
          </div>
        </section>
      )}

      {/* 外观配置 */}
      {(model.sunroof || model.wheels || model.headlights || model.hiddenHandle !== null || model.electricTail !== null) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">外观配置</h2>
          <div className="divide-y text-sm">
            <ParamRow label="天窗" value={model.sunroof} />
            <ParamRow label="轮毂" value={model.wheels} />
            <ParamRow label="大灯" value={model.headlights} />
            <ParamRow label="隐藏门把手" value={model.hiddenHandle === true ? "标配" : model.hiddenHandle === false ? "无" : null} />
            <ParamRow label="电动尾门" value={model.electricTail === true ? "标配" : model.electricTail === false ? "无" : null} />
          </div>
        </section>
      )}

      {/* 内饰配置 */}
      {(model.seatMaterial || model.seatVentHeat || model.steeringHeat !== null || model.ambientLight || model.rearScreen) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">内饰配置</h2>
          <div className="divide-y text-sm">
            <ParamRow label="座椅材质" value={model.seatMaterial} />
            <ParamRow label="座椅通风/加热" value={model.seatVentHeat} />
            <ParamRow label="方向盘加热" value={model.steeringHeat === true ? "标配" : model.steeringHeat === false ? "无" : null} />
            <ParamRow label="氛围灯" value={model.ambientLight} />
            <ParamRow label="后排娱乐屏" value={model.rearScreen} />
          </div>
        </section>
      )}

      {/* 安全配置 */}
      {(model.airbags || model.tirePressure || model.autoBrake !== null || model.blindSpot !== null) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">安全配置</h2>
          <div className="divide-y text-sm">
            <ParamRow label="安全气囊" value={model.airbags ? `${model.airbags}个` : null} />
            <ParamRow label="胎压监测" value={model.tirePressure} />
            <ParamRow label="自动刹车" value={model.autoBrake === true ? "标配" : model.autoBrake === false ? "无" : null} />
            <ParamRow label="盲区监测" value={model.blindSpot === true ? "标配" : model.blindSpot === false ? "无" : null} />
          </div>
        </section>
      )}

      {/* 舒适便利 */}
      {(model.acType || model.airPurifier !== null || model.wirelessCharge !== null || model.hud || model.keyless !== null || model.remoteControl) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">舒适便利</h2>
          <div className="divide-y text-sm">
            <ParamRow label="空调" value={model.acType} />
            <ParamRow label="空气净化" value={model.airPurifier === true ? "标配" : model.airPurifier === false ? "无" : null} />
            <ParamRow label="无线充电" value={model.wirelessCharge === true ? "标配" : model.wirelessCharge === false ? "无" : null} />
            <ParamRow label="HUD抬头显示" value={model.hud} />
            <ParamRow label="无钥匙进入" value={model.keyless === true ? "标配" : model.keyless === false ? "无" : null} />
            <ParamRow label="远程控制" value={model.remoteControl} />
          </div>
        </section>
      )}

      {/* 驾驶辅助 */}
      {(model.acc || model.lka !== null || model.autoPark || model.remotePark !== null || model.nop) && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">驾驶辅助</h2>
          <div className="divide-y text-sm">
            <ParamRow label="自适应巡航" value={model.acc} />
            <ParamRow label="车道保持" value={model.lka === true ? "标配" : model.lka === false ? "无" : null} />
            <ParamRow label="自动泊车" value={model.autoPark} />
            <ParamRow label="远程泊车" value={model.remotePark === true ? "标配" : model.remotePark === false ? "无" : null} />
            <ParamRow label="领航辅助" value={model.nop} />
          </div>
        </section>
      )}

      {/* 销量数据 */}
      {model.salesVolume2025 && (
        <section className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">销量数据</h2>
          <div className="divide-y text-sm">
            <ParamRow label="2025年销量" value={model.salesVolume2025.toLocaleString()} unit="辆" />
          </div>
        </section>
      )}

      {/* 相关资讯 */}
      {model.articles.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">相关资讯</h2>
          <div className="space-y-3">
            {model.articles.map((a) => (
              <Link key={a.id} href={`/news/${a.slug}`} className="block p-4 border rounded-lg hover:shadow-md hover:border-blue-200 transition">
                <div className="flex justify-between items-start">
                  <div><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{a.type === "news" ? "新闻" : a.type === "review" ? "评测" : "导购"}</span><h3 className="font-medium mt-1">{a.title}</h3></div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("zh-CN") : ""}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 二手车源 */}
      {model.carSources.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{model.brand.name} {model.name} 二手车源</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {model.carSources.map((cs) => (
              <Link key={cs.id} href={`/used-cars/${cs.id}`} className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold">{cs.year}年 · {String(cs.mileage)}万公里</h3>
                <p className="text-sm text-gray-500 mt-1">📍{cs.city}</p>
                <p className="text-red-600 font-bold text-xl mt-2">{String(cs.price)}万</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 同品牌 & 竞品 */}
      {siblings.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{model.brand.name}其他车型</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {siblings.map((si) => (<Link key={si.id} href={`/new-cars/${si.slug}`} className="border rounded-lg p-3 hover:shadow-md transition text-center"><div className="text-xs text-gray-400 mb-1">{si.evType}</div><div className="font-medium text-sm">{si.name}</div><div className="text-xs text-gray-500 mt-1">{si.priceMin && si.priceMax ? `${String(si.priceMin)}-${String(si.priceMax)}万` : "暂无报价"}</div></Link>))}
          </div>
        </section>
      )}
      {competitors.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">同级别竞品对比</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {competitors.map((c) => (<Link key={c.id} href={`/new-cars/${c.slug}`} className="border rounded-lg p-3 hover:shadow-md transition text-center"><div className="text-xs text-gray-400 mb-1">{c.brand.name}</div><div className="font-medium text-sm">{c.name}</div><div className="text-xs text-gray-500 mt-1">{c.priceMin && c.priceMax ? `${String(c.priceMin)}-${String(c.priceMax)}万` : "暂无报价"}</div></Link>))}
          </div>
        </section>
      )}
    </div>
  );
}
