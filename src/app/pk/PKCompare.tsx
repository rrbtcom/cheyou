"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type ModelBasic = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  evType: string | null;
  level: string | null;
  priceMin: number | null;
  priceMax: number | null;
  brand: { id: string; name: string };
};

type Decimalish = { toString(): string } | number | null;
type ModelFull = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  evType: string | null;
  level: string | null;
  priceMin: Decimalish;
  priceMax: Decimalish;
  motorType: string | null;
  motorPower: Decimalish;
  motorTorque: Decimalish;
  batteryCapacity: Decimalish;
  batteryType: string | null;
  rangeCLTC: Decimalish;
  rangeWLTC: Decimalish;
  acceleration: Decimalish;
  topSpeed: Decimalish;
  fuelType: string | null;
  fuelConsumption: Decimalish;
  enginePower: Decimalish;
  engineTorque: Decimalish;
  length: Decimalish;
  width: Decimalish;
  height: Decimalish;
  wheelbase: Decimalish;
  trunkVolume: Decimalish;
  weight: Decimalish;
  seats: number | null;
  driveMode: string | null;
  suspensionF: string | null;
  suspensionR: string | null;
  chip: string | null;
  adasLevel: string | null;
  screen: string | null;
  carPlay: boolean | null;
  ota: boolean | null;
  chargeFast: Decimalish;
  chargeSlow: Decimalish;
  chargePower: Decimalish;
  voltage: string | null;
  salesVolume2025: number | null;
  sunroof: string | null;
  wheels: string | null;
  headlights: string | null;
  hiddenHandle: boolean | null;
  electricTail: boolean | null;
  seatMaterial: string | null;
  seatVentHeat: string | null;
  steeringHeat: boolean | null;
  ambientLight: string | null;
  rearScreen: string | null;
  airbags: number | null;
  tirePressure: string | null;
  autoBrake: boolean | null;
  blindSpot: boolean | null;
  acType: string | null;
  airPurifier: boolean | null;
  wirelessCharge: boolean | null;
  hud: string | null;
  keyless: boolean | null;
  remoteControl: string | null;
  acc: string | null;
  lka: boolean | null;
  autoPark: string | null;
  remotePark: boolean | null;
  nop: string | null;
  brand: { id: string; name: string; logoUrl?: string | null; country?: string | null; createdAt?: Date };
};

function ModelSelector({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: ModelFull | null;
  onSelect: (m: ModelFull) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ModelBasic[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/models?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = async (m: ModelBasic) => {
    // Fetch full model data
    const res = await fetch(`/api/models?q=${m.brand.name}+${m.name}`);
    const data: ModelBasic[] = await res.json();
    const full = data.find((d) => d.slug === m.slug);
    if (full) {
      // Fetch from detail page API to get all fields
      const detailRes = await fetch(`/api/models?q=${m.slug}`);
      const detailData: ModelBasic[] = await detailRes.json();
      const found = detailData.find((d) => d.slug === m.slug);
      // We need full model - fetch from search API which includes all fields
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(m.brand.name + " " + m.name)}`);
      const searchData = await searchRes.json();
      const fullModel = searchData.models?.find((d: ModelFull) => d.slug === m.slug);
      if (fullModel) {
        onSelect(fullModel);
      }
    }
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="flex-1" ref={ref}>
      <div className="text-center text-sm text-gray-400 mb-2">{label}</div>
      {selected ? (
        <div className="border rounded-lg p-4 text-center">
          <div className="h-28 bg-gray-50 rounded mb-3 relative overflow-hidden mx-auto max-w-[200px]">
            {selected.imageUrl ? (
              <Image src={selected.imageUrl} alt={`${selected.brand.name} ${selected.name}`} fill className="object-cover" sizes="200px" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">暂无图片</div>
            )}
          </div>
          <div className="text-xs text-blue-600 mb-1">{selected.evType} · {selected.level}</div>
          <h3 className="font-bold text-lg">{selected.brand.name} {selected.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {selected.priceMin && selected.priceMax ? `${Number(selected.priceMin)}-${Number(selected.priceMax)}万` : "暂无报价"}
          </p>
          <button
            onClick={() => onSelect(null as unknown as ModelFull)}
            className="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            更换车型
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="搜索车型..."
            className="w-full border rounded-lg px-4 py-3 text-center focus:outline-none focus:border-blue-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">搜索中...</div>
          )}
          {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {results.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0"
                >
                  {m.imageUrl ? (
                    <div className="w-12 h-8 relative shrink-0">
                      <Image src={m.imageUrl} alt={m.name} fill className="object-cover rounded" sizes="48px" />
                    </div>
                  ) : (
                    <div className="w-12 h-8 bg-gray-100 rounded shrink-0 flex items-center justify-center text-xs">🚗</div>
                  )}
                  <div>
                    <div className="text-sm font-medium">{m.brand.name} {m.name}</div>
                    <div className="text-xs text-gray-400">{m.evType} · {m.level}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {open && !loading && query && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-gray-400">
              未找到匹配车型
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function toNum(v: Decimalish): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function formatSalesLocal(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

function compareVal(a: Decimalish, b: Decimalish, direction: "higher" | "lower" = "higher"): "left" | "right" | null {
  const na = toNum(a), nb = toNum(b);
  if (na === null || nb === null) return null;
  if (na === nb) return null;
  if (direction === "higher") return na > nb ? "left" : "right";
  return na < nb ? "left" : "right";
}

export default function PKCompare({
  leftModel: initialLeft,
  rightModel: initialRight,
}: {
  leftModel: ModelFull | null;
  rightModel: ModelFull | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [left, setLeft] = useState<ModelFull | null>(initialLeft);
  const [right, setRight] = useState<ModelFull | null>(initialRight);

  // Update URL when models change
  useEffect(() => {
    const params = new URLSearchParams();
    if (left) params.set("left", left.slug);
    if (right) params.set("right", right.slug);
    const qs = params.toString();
    const current = searchParams.toString();
    if (qs !== current) {
      router.replace(`/pk${qs ? `?${qs}` : ""}`);
    }
  }, [left, right]);

  const handleSelectLeft = (m: ModelFull) => setLeft(m);
  const handleSelectRight = (m: ModelFull) => setRight(m);

  const s = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const num = Number(v);
    if (isNaN(num)) return String(v);
    return String(Math.round(num * 100) / 100);
  };

  const val = (v: unknown) => (v === null || v === undefined ? "—" : s(v));

  // Parameter groups for comparison
  const paramGroups = [
    {
      title: "价格",
      items: [
        { label: "指导价", left: left?.priceMin && left?.priceMax ? `${s(left.priceMin)}-${s(left.priceMax)}万` : null, right: right?.priceMin && right?.priceMax ? `${s(right.priceMin)}-${s(right.priceMax)}万` : null, winner: null },
      ],
    },
    {
      title: "动力系统",
      items: [
        { label: "电机类型", left: val(left?.motorType), right: val(right?.motorType), winner: null },
        { label: "电机功率(kW)", left: left?.motorPower, right: right?.motorPower, winner: compareVal(left?.motorPower ?? null, right?.motorPower ?? null, "higher") },
        { label: "电机扭矩(N·m)", left: left?.motorTorque, right: right?.motorTorque, winner: compareVal(left?.motorTorque ?? null, right?.motorTorque ?? null, "higher") },
        { label: "0-100加速(s)", left: left?.acceleration, right: right?.acceleration, winner: compareVal(left?.acceleration ?? null, right?.acceleration ?? null, "lower") },
        { label: "最高车速(km/h)", left: left?.topSpeed, right: right?.topSpeed, winner: compareVal(left?.topSpeed ?? null, right?.topSpeed ?? null, "higher") },
        { label: "发动机功率(kW)", left: left?.enginePower, right: right?.enginePower, winner: compareVal(left?.enginePower ?? null, right?.enginePower ?? null, "higher") },
        { label: "发动机扭矩(N·m)", left: left?.engineTorque, right: right?.engineTorque, winner: compareVal(left?.engineTorque ?? null, right?.engineTorque ?? null, "higher") },
        { label: "燃油标号", left: val(left?.fuelType), right: val(right?.fuelType), winner: null },
        { label: "综合油耗(L/100km)", left: left?.fuelConsumption, right: right?.fuelConsumption, winner: compareVal(left?.fuelConsumption ?? null, right?.fuelConsumption ?? null, "lower") },
      ],
    },
    {
      title: "电池续航",
      items: [
        { label: "电池容量(kWh)", left: left?.batteryCapacity, right: right?.batteryCapacity, winner: compareVal(left?.batteryCapacity ?? null, right?.batteryCapacity ?? null, "higher") },
        { label: "电池类型", left: val(left?.batteryType), right: val(right?.batteryType), winner: null },
        { label: "CLTC续航(km)", left: left?.rangeCLTC, right: right?.rangeCLTC, winner: compareVal(left?.rangeCLTC ?? null, right?.rangeCLTC ?? null, "higher") },
        { label: "WLTC续航(km)", left: left?.rangeWLTC, right: right?.rangeWLTC, winner: compareVal(left?.rangeWLTC ?? null, right?.rangeWLTC ?? null, "higher") },
        { label: "快充时间(h)", left: left?.chargeFast, right: right?.chargeFast, winner: compareVal(left?.chargeFast ?? null, right?.chargeFast ?? null, "lower") },
        { label: "慢充时间(h)", left: left?.chargeSlow, right: right?.chargeSlow, winner: compareVal(left?.chargeSlow ?? null, right?.chargeSlow ?? null, "lower") },
        { label: "充电功率(kW)", left: left?.chargePower, right: right?.chargePower, winner: compareVal(left?.chargePower ?? null, right?.chargePower ?? null, "higher") },
        { label: "电压平台", left: val(left?.voltage), right: val(right?.voltage), winner: null },
      ],
    },
    {
      title: "车身尺寸",
      items: [
        { label: "长(mm)", left: left?.length, right: right?.length, winner: compareVal(left?.length ?? null, right?.length ?? null, "higher") },
        { label: "宽(mm)", left: left?.width, right: right?.width, winner: compareVal(left?.width ?? null, right?.width ?? null, "higher") },
        { label: "高(mm)", left: left?.height, right: right?.height, winner: compareVal(left?.height ?? null, right?.height ?? null, "higher") },
        { label: "轴距(mm)", left: left?.wheelbase, right: right?.wheelbase, winner: compareVal(left?.wheelbase ?? null, right?.wheelbase ?? null, "higher") },
        { label: "后备箱(L)", left: left?.trunkVolume, right: right?.trunkVolume, winner: compareVal(left?.trunkVolume ?? null, right?.trunkVolume ?? null, "higher") },
        { label: "整备质量(kg)", left: left?.weight, right: right?.weight, winner: compareVal(left?.weight ?? null, right?.weight ?? null, "lower") },
        { label: "座位数", left: left?.seats, right: right?.seats, winner: null },
      ],
    },
    {
      title: "底盘悬挂",
      items: [
        { label: "驱动方式", left: val(left?.driveMode), right: val(right?.driveMode), winner: null },
        { label: "前悬挂", left: val(left?.suspensionF), right: val(right?.suspensionF), winner: null },
        { label: "后悬挂", left: val(left?.suspensionR), right: val(right?.suspensionR), winner: null },
      ],
    },
    {
      title: "智能配置",
      items: [
        { label: "芯片", left: val(left?.chip), right: val(right?.chip), winner: null },
        { label: "智驾等级", left: val(left?.adasLevel), right: val(right?.adasLevel), winner: null },
        { label: "中控屏", left: val(left?.screen), right: val(right?.screen), winner: null },
        { label: "CarPlay", left: left?.carPlay === true ? "✓" : left?.carPlay === false ? "✗" : "—", right: right?.carPlay === true ? "✓" : right?.carPlay === false ? "✗" : "—", winner: null },
        { label: "OTA升级", left: left?.ota === true ? "✓" : left?.ota === false ? "✗" : "—", right: right?.ota === true ? "✓" : right?.ota === false ? "✗" : "—", winner: null },
      ],
    },
    {
      title: "外观配置",
      items: [
        { label: "天窗", left: val(left?.sunroof), right: val(right?.sunroof), winner: null },
        { label: "轮毂", left: val(left?.wheels), right: val(right?.wheels), winner: null },
        { label: "大灯", left: val(left?.headlights), right: val(right?.headlights), winner: null },
        { label: "隐藏门把手", left: left?.hiddenHandle === true ? "✓" : left?.hiddenHandle === false ? "✗" : "—", right: right?.hiddenHandle === true ? "✓" : right?.hiddenHandle === false ? "✗" : "—", winner: null },
        { label: "电动尾门", left: left?.electricTail === true ? "✓" : left?.electricTail === false ? "✗" : "—", right: right?.electricTail === true ? "✓" : right?.electricTail === false ? "✗" : "—", winner: null },
      ],
    },
    {
      title: "内饰配置",
      items: [
        { label: "座椅材质", left: val(left?.seatMaterial), right: val(right?.seatMaterial), winner: null },
        { label: "座椅通风加热", left: val(left?.seatVentHeat), right: val(right?.seatVentHeat), winner: null },
        { label: "方向盘加热", left: left?.steeringHeat === true ? "✓" : left?.steeringHeat === false ? "✗" : "—", right: right?.steeringHeat === true ? "✓" : right?.steeringHeat === false ? "✗" : "—", winner: null },
        { label: "氛围灯", left: val(left?.ambientLight), right: val(right?.ambientLight), winner: null },
        { label: "后排娱乐屏", left: val(left?.rearScreen), right: val(right?.rearScreen), winner: null },
      ],
    },
    {
      title: "安全配置",
      items: [
        { label: "气囊数量", left: left?.airbags ? String(left.airbags) : "—", right: right?.airbags ? String(right.airbags) : "—", winner: compareVal(left?.airbags ?? null, right?.airbags ?? null, "higher") },
        { label: "胎压监测", left: val(left?.tirePressure), right: val(right?.tirePressure), winner: null },
        { label: "AEB自动制动", left: left?.autoBrake === true ? "✓" : left?.autoBrake === false ? "✗" : "—", right: right?.autoBrake === true ? "✓" : right?.autoBrake === false ? "✗" : "—", winner: null },
        { label: "盲区监测", left: left?.blindSpot === true ? "✓" : left?.blindSpot === false ? "✗" : "—", right: right?.blindSpot === true ? "✓" : right?.blindSpot === false ? "✗" : "—", winner: null },
      ],
    },
    {
      title: "舒适便利",
      items: [
        { label: "空调", left: val(left?.acType), right: val(right?.acType), winner: null },
        { label: "空气净化", left: left?.airPurifier === true ? "✓" : left?.airPurifier === false ? "✗" : "—", right: right?.airPurifier === true ? "✓" : right?.airPurifier === false ? "✗" : "—", winner: null },
        { label: "无线充电", left: left?.wirelessCharge === true ? "✓" : left?.wirelessCharge === false ? "✗" : "—", right: right?.wirelessCharge === true ? "✓" : right?.wirelessCharge === false ? "✗" : "—", winner: null },
        { label: "抬头显示", left: val(left?.hud), right: val(right?.hud), winner: null },
        { label: "无钥匙进入", left: left?.keyless === true ? "✓" : left?.keyless === false ? "✗" : "—", right: right?.keyless === true ? "✓" : right?.keyless === false ? "✗" : "—", winner: null },
        { label: "远程控制", left: val(left?.remoteControl), right: val(right?.remoteControl), winner: null },
      ],
    },
    {
      title: "驾驶辅助",
      items: [
        { label: "自适应巡航", left: val(left?.acc), right: val(right?.acc), winner: null },
        { label: "车道保持", left: left?.lka === true ? "✓" : left?.lka === false ? "✗" : "—", right: right?.lka === true ? "✓" : right?.lka === false ? "✗" : "—", winner: null },
        { label: "自动泊车", left: val(left?.autoPark), right: val(right?.autoPark), winner: null },
        { label: "遥控泊车", left: left?.remotePark === true ? "✓" : left?.remotePark === false ? "✗" : "—", right: right?.remotePark === true ? "✓" : right?.remotePark === false ? "✗" : "—", winner: null },
        { label: "领航辅助", left: val(left?.nop), right: val(right?.nop), winner: null },
      ],
    },
    {
      title: "销量数据",
      items: [
        { label: "2025年销量", left: left?.salesVolume2025 ? formatSalesLocal(left.salesVolume2025) : "—", right: right?.salesVolume2025 ? formatSalesLocal(right.salesVolume2025) : "—", winner: compareVal(left?.salesVolume2025 ?? null, right?.salesVolume2025 ?? null, "higher") },
      ],
    },
  ];

  // Count wins
  let leftWins = 0;
  let rightWins = 0;
  paramGroups.forEach((g) => {
    g.items.forEach((item) => {
      if (item.winner === "left") leftWins++;
      if (item.winner === "right") rightWins++;
    });
  });

  return (
    <>
      {/* 选车区域 */}
      <div className="flex gap-4 md:gap-8 items-start mb-8">
        <ModelSelector label="车型 A" selected={left} onSelect={handleSelectLeft} />
        <div className="flex flex-col items-center justify-center pt-8 shrink-0">
          <div className="text-3xl font-black text-gray-300">VS</div>
          {left && right && (leftWins > 0 || rightWins > 0) && (
            <div className="mt-2 text-xs text-gray-400">
              <span className="text-blue-600 font-bold">{leftWins}</span> : <span className="text-red-600 font-bold">{rightWins}</span>
            </div>
          )}
        </div>
        <ModelSelector label="车型 B" selected={right} onSelect={handleSelectRight} />
      </div>

      {/* 对比表格 */}
      {left && right ? (
        <div className="border rounded-lg overflow-hidden">
          {paramGroups.map((group) => {
            const hasData = group.items.some((item) => {
              const lv = item.left, rv = item.right;
              return lv !== "—" && rv !== "—" && lv !== null && rv !== null;
            });
            if (!hasData) return null;
            return (
              <div key={group.title}>
                {/* Group header */}
                <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 text-sm border-b">{group.title}</div>
                {group.items.map((item) => {
                  const lv = item.left === null || item.left === undefined ? "—" : String(item.left);
                  const rv = item.right === null || item.right === undefined ? "—" : String(item.right);
                  if (lv === "—" && rv === "—") return null;
                  return (
                    <div key={item.label} className="grid grid-cols-3 text-sm border-b last:border-b-0">
                      <div className={`px-4 py-3 text-right ${item.winner === "left" ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-600"}`}>
                        {lv}
                        {item.winner === "left" && <span className="ml-1 text-xs">🏆</span>}
                      </div>
                      <div className="px-4 py-3 text-center text-gray-400 bg-gray-50/50 border-x">{item.label}</div>
                      <div className={`px-4 py-3 text-left ${item.winner === "right" ? "bg-red-50 font-semibold text-red-700" : "text-gray-600"}`}>
                        {item.winner === "right" && <span className="mr-1 text-xs">🏆</span>}
                        {rv}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 底部入口 */}
          <div className="grid grid-cols-2 bg-gray-50">
            <div className="p-4 text-center">
              <Link href={`/new-cars/${left.slug}`} className="text-blue-600 text-sm hover:underline">
                查看 {left.brand.name} {left.name} 详情 →
              </Link>
            </div>
            <div className="p-4 text-center">
              <Link href={`/new-cars/${right.slug}`} className="text-blue-600 text-sm hover:underline">
                查看 {right.brand.name} {right.name} 详情 →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">👆 请选择两款车型开始对比</p>
          <p className="text-sm">点击上方搜索框输入品牌或车型名</p>
        </div>
      )}
    </>
  );
}
