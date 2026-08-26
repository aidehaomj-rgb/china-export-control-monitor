"use client";

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import data from "../public/data/control-entities.json";
import { supplementalEntities, supplementalNotices, unreliableEntityIds, type RegulationType } from "./regulatory-data";

type View = "home" | "entities" | "notices" | "timeline" | "screening";
type MenuId = "entities" | "policy" | "research";
type Entity = (typeof data.entities)[number];
type RegulatoryEntity = Entity & { regulationTypes: RegulationType[] };
type ScreeningNode = { stage: string; name: string; note: string; tone: "source" | "subject" | "alternate" | "destination"; connection?: "verified" | "pending"; linkLabel?: string };
type NodePosition = { x: number; y: number };
type ScreeningEvidence = { category: string; title: string; detail: string; source?: string; url?: string };
type ScreeningCase = { entityId: number; finding: string; confidence: string; summary: string; checks: string[]; nodes: ScreeningNode[]; evidence: ScreeningEvidence[]; gaps: string[] };

const regionTone: Record<string, string> = {
  美国: "red",
  日本: "amber",
  欧盟: "blue",
  台湾地区: "violet",
  加拿大: "green",
};
const regionColor: Record<string, string> = {
  美国: "#08c8d5",
  日本: "#347cff",
  欧盟: "#7b68f6",
  台湾地区: "#ee5fa8",
  加拿大: "#28b78d",
};

const regulationTypes: RegulationType[] = ["管控名单", "不可靠实体", "关注名单"];
const regulationTone: Record<RegulationType, string> = {
  管控名单: "regulation-control",
  不可靠实体: "regulation-unreliable",
  关注名单: "regulation-watch",
};
const regulationColor: Record<RegulationType, string> = {
  管控名单: "#08aebd",
  不可靠实体: "#e85f76",
  关注名单: "#eea43a",
};
const regulatoryEntities: RegulatoryEntity[] = [
  ...data.entities.map((item) => ({
    ...item,
    regulationTypes: ["管控名单" as const, ...(unreliableEntityIds.has(item.id) ? ["不可靠实体" as const] : [])],
  })),
  ...supplementalEntities,
];
const notices = [
  ...data.notices.map((notice) => ({ ...notice, regulationType: "管控名单" as const })),
  ...supplementalNotices,
].sort((a, b) => b.date.localeCompare(a.date) || b.notice.localeCompare(a.notice));

const regionTotal = regulatoryEntities.reduce<Record<string, number>>((acc, item) => {
  acc[item.region] = (acc[item.region] || 0) + 1;
  return acc;
}, {});

let regionCursor = 0;
const regionData = ["美国", "日本", "欧盟", "台湾地区", "加拿大"].map((name) => {
  const count = regionTotal[name] || 0;
  const share = (count / regulatoryEntities.length) * 100;
  const angle = -90 + (regionCursor + share / 2) * 3.6;
  regionCursor += share;
  return { name, count, share, tone: regionTone[name], angle };
}).filter((item) => item.count > 0);
const regulationData = regulationTypes.map((name) => ({
  name,
  count: regulatoryEntities.filter((item) => item.regulationTypes.includes(name)).length,
  color: regulationColor[name],
}));
const maxRegulationCount = Math.max(...regulationData.map((item) => item.count));
const companyCount = regulatoryEntities.filter((item) => item.entityType === "企业").length;
const institutionCount = regulatoryEntities.length - companyCount;
const screeningEntityIds = [1, 2, 3, 4, 5, 29, 33, 53, 55];
const screeningEntities = regulatoryEntities.filter((item) => screeningEntityIds.includes(item.id));
const screeningCases: ScreeningCase[] = [
  {
    entityId: 1,
    finding: "高风险供应链",
    confidence: "A级 · 100分",
    summary: "易迅数据显示，列管后General Dynamics旗下NASSCO持续接收中国供应商的船用阀门与控制舱舷梯部件；官方资料将NASSCO明确列为General Dynamics海事系统业务单元，已形成“境内供货—集团业务单元收货—列名母公司”的证据闭环。",
    checks: ["General Dynamics / NASSCO法定名称与集团关系", "2024-08-20至2026-08-20两年数据", "中国原产筛选与206条基准结果", "货描、日期、重量和收货主体"],
    nodes: [
      { stage: "中国供应端", name: "Neway Valve (Suzhou) / Ningbo Sup Bearing", note: "苏州阀门与宁波船舶结构件供应节点", tone: "source", connection: "verified", linkLabel: "中国原产" },
      { stage: "集团收货单元", name: "General Dynamics NASSCO", note: "General Dynamics海事系统业务单元", tone: "alternate", connection: "verified", linkLabel: "管控后进口" },
      { stage: "列名母公司", name: "General Dynamics", note: "2025-01-02起列入出口管制管控名单", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "General Dynamics自2025年1月2日起列名", detail: "商务部公告2025年第1号将通用动力公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/dwmygl/art/2025/art_c14d6b7d45e247c596f4d3ecdda9b291.html" },
      { category: "关系证据", title: "NASSCO属于General Dynamics海事系统", detail: "General Dynamics官网将NASSCO列为Marine Systems业务单元，并说明其承担辅助舰、支援舰和船舶维修业务。", source: "General Dynamics 官方业务页", url: "https://www.gd.com/our-businesses/marine-systems" },
      { category: "易迅验证", title: "206条基准结果中筛得3条中国来源记录", detail: "查询条件：采购商GENERAL DYNAMICS NASSCO，时间2024-08-20至2026-08-20；中国来源结果包括2025-07-07控制舱舷梯部件，以及2026-08-15苏州Neway船用阀门。", source: "易迅数据 · 美国进口记录 · 2026-08-25核验" },
      { category: "交易证据", title: "列管后中国船舶部件直接进入NASSCO", detail: "2025-07-07，Ningbo Sup Bearing向NASSCO交付CONTROL HOUSE COMPANIONWAY/STAIRWAY，5件、2,095千克；2026-08-15，Neway Valve (Suzhou)交付阀门，合计35件、23,154千克。", source: "易迅数据 · 中国原产筛选" },
      { category: "综合评分", title: "证据闭环评分：100/100", detail: "列管身份15/15、集团关系20/20、中国来源25/25、管控后交易25/25、船舶产品匹配15/15。评分仅用于风险排序，不构成违规认定。" },
    ],
    gaps: ["取得原始提单号、商业发票与原产地证", "核对阀门及结构件对应的具体舰船项目", "核验相关物项编码与许可证状态"],
  },
  {
    entityId: 2,
    finding: "高风险替代供应链",
    confidence: "A级 · 100分",
    summary: "易迅全量核验确认：列管后L3Harris既从上海直接进口电源，也通过香港Fabricators与Kopplen持续接收车载充电器、线缆和电台附件；公开制造资料同时指向广东东莞生产体系。",
    checks: ["L3Harris Technologies精确采购商名称", "149条结果逐页读取与147条精确去重", "中国内地、香港与台湾来源筛选", "供应商、产品、日期与重量交叉核验"],
    nodes: [
      { stage: "中国制造端", name: "ICC Electronics (Dongguan) Ltd.", note: "Fabricators International 制造体系；广东东莞工厂", tone: "source", connection: "verified", linkLabel: "制造映射" },
      { stage: "境外承接主体", name: "Fabricators International Ltd.", note: "香港发货主体；车载充电器出口商", tone: "alternate", connection: "verified", linkLabel: "管控后发运" },
      { stage: "列名收货实体", name: "L3Harris Technologies Inc.", note: "美国收货人；2025-01-02起列入管控名单", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "L3Harris自2025年1月2日起列入管控名单", detail: "商务部公告2025年第1号将L3哈里斯公司列入出口管制管控名单，相关出口活动应当立即停止；特殊情况需申请许可。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/dwmygl/art/2025/art_c14d6b7d45e247c596f4d3ecdda9b291.html" },
      { category: "制造关系", title: "香港出口主体对应东莞制造体系", detail: "制造与检测资料将ICC Electronics (Dongguan) Ltd.与Fabricators International Ltd.并列标识为制造方/工厂，地址位于广东省东莞市清溪镇。", source: "制造商UN38.3资料", url: "https://www.netapp.com/media/65934-DocPack-310-00251-D2-271-00029.pdf" },
      { category: "交易证据", title: "管控后至少3票车载充电器到货", detail: "公开提单显示：2025-06-30为84箱、2025-11-18为83箱/757千克、2025-12-23为42箱/381千克；发货人均为香港Fabricators，收货人均为L3Harris。", source: "ImportGenius · 美国海关记录", url: "https://www.importgenius.com/importers/l3harris-technologies-inc" },
      { category: "易迅验证", title: "149条全量结果完成逐页核验", detail: "查询条件：采购商L3HARRIS TECHNOLOGIES、2024-08-20至2026-08-20；149条原始记录、147条可见字段唯一记录，其中35条进口，列管后中国内地/香港/台湾来源14条。", source: "易迅数据 · 8页逐页审计 · 2026-08-25核验" },
      { category: "直接进口", title: "上海供货方在列管后直接交付电源", detail: "2025-02-23，Omnion Power Shanghai Co Ltd向L3Harris Technologies Inc交付POWER SUPPLY/CONTAINER POWER SUPPLY，72件、777千克、金额15,540美元，易迅原产地标注为China。", source: "易迅数据 · 美国进口记录" },
      { category: "产品匹配", title: "货描与L3Harris官方通信产品一致", detail: "提单货描为VEHICULAR CHARGER；L3Harris官网将Premium Vehicular Charger列为XL系列任务通信电台配套充电设备。", source: "L3Harris 官方产品页", url: "https://www.l3harris.com/all-capabilities/xl-two-bay-portable-radio-charger" },
      { category: "综合评分", title: "证据闭环评分：100/100", detail: "列管身份15/15、中国来源25/25、境外承接20/20、管控后交易25/25、通信产品匹配15/15。直接上海记录与香港承接记录相互补强。" },
    ],
    gaps: ["取得商业发票、原产地证或生产批号，确认三票货物由东莞工厂实际生产", "核对提单采购订单及L3Harris料号，闭合具体型号对应关系", "按中国两用物项清单核定车载充电器及其部件的管制编码与许可证状态"],
  },
  {
    entityId: 3,
    finding: "暂未发现替代供应链",
    confidence: "—",
    summary: "易迅两年口径下暂未发现替代供应链：列名主体与IntelliEPI别名均为0条结果。",
    checks: ["INTELLIGENT EPITAXY TECHNOLOGY INC精确名称：0条", "INTELLIEPI别名：0条", "时间范围：2024-08-20至2026-08-20", "采购商、全球来源与中国原产口径"],
    nodes: [], evidence: [],
    gaps: ["地址、曾用名与报关名称映射", "外延片及关键原料商品词补查", "管控前进口基线"],
  },
  {
    entityId: 4,
    finding: "暂未发现替代供应链",
    confidence: "—",
    summary: "易迅两年口径下暂未发现替代供应链：Clear Align LLC与ClearAlign别名均为0条结果。",
    checks: ["CLEAR ALIGN LLC精确名称：0条", "CLEARALIGN别名：0条", "时间范围：2024-08-20至2026-08-20", "采购商、全球来源与中国原产口径"],
    nodes: [], evidence: [],
    gaps: ["采购订单与供应商名录", "光学材料上游原产地", "关联公司报关别名"],
  },
  {
    entityId: 5,
    finding: "集团承接风险线索",
    confidence: "B级 · 60分",
    summary: "波音防务精确名未检出记录，但其集团母体在管控后持续自中国进口航空材料与部件；集团内部最终流向尚未闭合。",
    checks: ["Boeing Defense, Space & Security精确名称：两年口径0条", "The Boeing Company集团进口主体", "300条原始结果全页读取与精确去重", "商品、防务关键词与最终用途反证核查"],
    nodes: [
      { stage: "中国供应端", name: "航空材料与部件供应商", note: "Novelis镇江、中化蓝天、烟台金泰、AVIC等", tone: "source", connection: "verified" },
      { stage: "集团进口主体", name: "The Boeing Company", note: "243条可见字段唯一记录；美国进口主体", tone: "alternate", connection: "pending" },
      { stage: "列名业务单元", name: "Boeing Defense, Space & Security", note: "集团关系已核实；内部货物流向待核", tone: "destination" },
    ],
    evidence: [
      { category: "关系证据", title: "BDS为波音三大业务单元之一", detail: "波音官网和2025年10-K均将Defense, Space & Security列为The Boeing Company的业务单元/报告分部。", source: "Boeing 官方公司页", url: "https://www.boeing.com/company" },
      { category: "交易证据", title: "管控后集团母体继续接收中国原产货物", detail: "易迅近一年口径返回300条原始结果，逐页读取后按可见字段精确去重为243条；主要包括铝板、PVF膜、商用飞机部件及锻件。", source: "易迅数据 · 美国进口/环球提单" },
      { category: "供应主体", title: "多家中国境内供应节点持续出现", detail: "可见供应商包括Novelis Aluminum (Zhenjiang)、Sinochem Lantian Fluoro Materials、Yantai Jintai、Boeing Tianjin Composites等。", source: "易迅数据 · 2025-08-24至2026-08-19" },
      { category: "证据边界", title: "尚无防务最终用途闭环", detail: "243条唯一记录中未命中BDS或具体防务型号关键词；部分货描明确为商用飞机，波音中国资料亦将多项在华供应说明为商用飞机供应链。", source: "Boeing 中国背景资料", url: "https://www.boeing.com/content/dam/boeing/boeingdotcom/company/key_orgs/boeing-international/pdf/chinabackgrounder.pdf" },
    ],
    gaps: ["中国材料进入BDS的内部领料、工单或项目编号", "列名业务单元管控前的直接进口基线", "原始提单号、采购订单与最终收货仓库", "57条重复出现记录的物理票归并"],
  },
  {
    entityId: 29,
    finding: "高风险替代供应链",
    confidence: "A级 · 100分",
    summary: "列管后，Leidos的安检设备子公司继续从天津、昆山和苏州接收CT机架、X光机组件及安检设备部件；易迅实际采购商名称存在AUTOMAT ION断词，反向供应商检索后形成完整证据链。",
    checks: ["LEIDOS与法定子公司名称双口径", "易迅实际断词AUTOMAT ION补查", "天津Schleifring供应商反向检索", "2025-03-04列管日前后日期与产品核验"],
    nodes: [
      { stage: "中国供应端", name: "Schleifring Tianjin / Sanmina Kunshan / Suzhou Shijia", note: "CT机架、X光机与安检设备组件", tone: "source", connection: "verified", linkLabel: "中国原产" },
      { stage: "集团进口主体", name: "Leidos Security Detection & Automation, Inc.", note: "Leidos安检设备子公司；美国收货人", tone: "alternate", connection: "verified", linkLabel: "管控后进口" },
      { stage: "列名母公司", name: "Leidos", note: "2025-03-04起列入出口管制管控名单", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Leidos自2025年3月4日起列名", detail: "商务部公告2025年第13号将莱多斯公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_39c51608fa5c40ee833f984cfcc24abe.html" },
      { category: "关系证据", title: "进口主体是Leidos列示子公司", detail: "Leidos 2026年SEC Exhibit 21继续列示Leidos Security Detection & Automation, Inc.为集团子公司。", source: "Leidos 2026 Form 10-K · Exhibit 21", url: "https://www.sec.gov/Archives/edgar/data/1336920/000133692026000030/ldos1022026ex21.htm" },
      { category: "易迅验证", title: "修正断词后命中14条精确记录", detail: "采购商使用易迅实际拼写LEIDOS SECURITY DETECTION & AUTOMAT ION, INC.，两年口径返回14条；其中列管后中国进口6条。", source: "易迅数据 · 环球提单 · 2026-08-25核验" },
      { category: "交易证据", title: "天津CT机架在列管后持续到货", detail: "2025-06-24、06-26、07-15各10件/7,905千克，2025-09-25与10-16各8件/6,324千克；货描均为CT GANTRY，供应商为Schleifring Transmission Technology（Tianjin）。", source: "易迅数据 · 中国原产筛选" },
      { category: "综合评分", title: "证据闭环评分：100/100", detail: "列管身份15/15、集团关系20/20、中国来源25/25、管控后交易25/25、安检设备产品匹配15/15。" },
    ],
    gaps: ["取得原始提单号和商业发票", "核验CT机架及X光组件的物项编码", "跟踪2026年Leidos安检业务合资重组后的实际收货主体"],
  },
  {
    entityId: 33,
    finding: "高风险替代供应链",
    confidence: "A级 · 92分",
    summary: "易迅两年基准查询返回718条Skydio记录；中国来源筛选命中2条列管后美国进口，供货方均为越南包装企业，形成“中国原产—越南主体—Skydio”的替代路径信号。",
    checks: ["SKYDIO INC两年基准：718条", "中国原产筛选：2条", "越南供应商与美国收货人名称", "日期、重量、件数与包装货描"],
    nodes: [
      { stage: "中国来源", name: "包装材料与组件", note: "易迅原产地字段标注China", tone: "source", connection: "verified", linkLabel: "原产标注" },
      { stage: "境外承接主体", name: "Super Bold Vietnam / J Packaging Vina", note: "越南发货企业；包装与箱体供应", tone: "alternate", connection: "verified", linkLabel: "列管后发运" },
      { stage: "列名收货实体", name: "Skydio, Inc.", note: "美国进口商；2025-03-04起列名", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Skydio自2025年3月4日起列名", detail: "商务部公告2025年第13号将斯凯迪奥公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_39c51608fa5c40ee833f984cfcc24abe.html" },
      { category: "易迅验证", title: "718条基准记录中筛得2条中国来源", detail: "查询条件：采购商SKYDIO INC，时间2024-08-20至2026-08-20；基准718条，中国来源2条，香港来源0条。", source: "易迅数据 · 美国进口记录 · 2026-08-25核验" },
      { category: "交易证据", title: "越南供应商向Skydio交付中国来源包装组件", detail: "2026-05-05，Super Bold (Vietnam) Packaging交付57件、1,819千克；2026-04-21，J Packaging Vina交付126件、716千克。易迅原产地均标注China。", source: "易迅数据 · 中国原产筛选" },
      { category: "证据边界", title: "产品为包装材料，未闭合无人机核心部件", detail: "货描包括纸托、板材、保护角、塑料卡扣和瓦楞箱；可以证明列管后中国来源交易延续，但不能据此推断进入无人机核心系统。" },
      { category: "综合评分", title: "风险评分：92/100", detail: "列管身份15/15、中国来源25/25、境外承接20/20、管控后交易25/25、产品关联7/15。高分代表排查优先级，不代表规避管制的法律结论。" },
    ],
    gaps: ["取得原产地证与越南供应商采购发票", "确认包装组件是否随整机或备件项目配套", "补查越南供应商的中国上游生产企业"],
  },
  {
    entityId: 53,
    finding: "高风险替代供应链",
    confidence: "A级 · 98分",
    summary: "列管后，马来西亚Oceaneering Solus向Oceaneering International交付自动驾驶人员运输车；易迅原产地标注为中国，构成“中国产品—马来西亚关联主体—列名实体”的高风险链路。",
    checks: ["OCEANEERING INTERNATIONAL INC精确采购商", "中国原产条件", "Oceaneering Solus Malaysia关系", "自动驾驶车辆货描、日期与重量"],
    nodes: [
      { stage: "中国来源", name: "GRT People Mover Pilot Autonomous Vehicle", note: "易迅原产地字段标注China；9,660千克", tone: "source", connection: "verified", linkLabel: "原产标注" },
      { stage: "境外承接主体", name: "Oceaneering Solus (Malaysia) Sdn Bhd", note: "马来西亚发货主体；SEC历史披露为关联企业", tone: "alternate", connection: "verified", linkLabel: "关联发运" },
      { stage: "列名收货实体", name: "Oceaneering International, Inc.", note: "美国进口商；2025-04-04起列名", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Oceaneering International自2025年4月4日起列名", detail: "商务部公告2025年第21号将国际海洋工程公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_210b619d46384bcdbbc5265ca74c5412.html" },
      { category: "易迅验证", title: "列管后命中1条中国来源自动驾驶车辆", detail: "2026-05-04，Oceaneering Solus (Malaysia)向Oceaneering International交付1台GRT PEOPLE MOVER PILOT AUTONOMOUS VEHICLE，重量9,660千克，目的国美国、原产地China。", source: "易迅数据 · 美国进口记录 · 2026-08-25核验" },
      { category: "关系证据", title: "SEC历史披露Oceaneering Solus Malaysia关联关系", detail: "Oceaneering的SEC Exhibit 21曾列示Oceaneering Solus (Malaysia) Sdn. Bhd.及49%持股比例；最新股权与名称仍需补证。", source: "Oceaneering SEC Exhibit 21", url: "https://www.sec.gov/Archives/edgar/data/73756/000007375621000023/oii_exhibit2101x12312020.htm" },
      { category: "产品匹配", title: "自动驾驶人员运输车与集团移动机器人业务高度相关", detail: "货描直接指向自动驾驶车辆，不是普通耗材；Oceaneering公开业务覆盖移动机器人与恶劣环境工程技术。", source: "Oceaneering 2025 Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/73756/000007375626000016/oii-20251231.htm" },
      { category: "综合评分", title: "风险评分：98/100", detail: "列管身份15/15、中国来源25/25、境外承接18/20、管控后交易25/25、产品匹配15/15。扣2分为马来西亚主体当前股权关系需刷新。" },
    ],
    gaps: ["取得2026年最新股权文件与关联交易说明", "取得车辆原产地证、采购合同及运输单证", "核验车辆最终项目、物项编码与许可证状态"],
  },
  {
    entityId: 55,
    finding: "高风险候选链路",
    confidence: "B级 · 85分",
    summary: "易迅确认MKA Engineers在2026-06-09向Cubic Transportation Systems交付印度来源不锈钢制品；同一MKA主体在此前数月从中国采购安防与机电组件。两段链已出现，但具体货品连续性尚未闭合。",
    checks: ["CUBIC TRANSPORTATION SYSTEMS INC精确名称", "MKA ENGINEERS注册名与出口名", "MKA中国上游219条两年结果", "两段日期、货描与主体一致性"],
    nodes: [
      { stage: "中国上游", name: "Gunnebo Security (China) Co. Ltd", note: "交通灯、电气总成与TITAN组件", tone: "source", connection: "verified", linkLabel: "MKA进口" },
      { stage: "第三国承接", name: "MKA Engineers and Exporters Pvt Ltd", note: "印度进口商及对美发货人", tone: "alternate", connection: "pending", linkLabel: "货品连续性" },
      { stage: "集团收货实体", name: "Cubic Transportation Systems, Inc.", note: "Cubic Corporation交通系统业务", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Cubic Corporation自2025年4月4日起列名", detail: "商务部公告2025年第21号将立方公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_210b619d46384bcdbbc5265ca74c5412.html" },
      { category: "下游交易", title: "MKA向Cubic交通系统交付不锈钢制品", detail: "2026-06-09，MKA Engineers and Exporters Pvt. Ltd.向Cubic Transportation Systems, Inc.交付STAINLESS STEEL FABRICATED GOODS，3件、488千克，原产地India。", source: "易迅数据 · 美国进口记录" },
      { category: "上游交易", title: "MKA在对Cubic发货前持续从中国采购", detail: "MKA注册名两年口径返回219条；2025-12-16与2026-01-26多批从Gunnebo Security (China)进口交通灯、电气总成与TITAN组件。", source: "易迅数据 · 印度进口记录 · 2026-08-25核验" },
      { category: "证据边界", title: "两段货描尚未形成同货闭环", detail: "中国上游为安防/机电组件，对Cubic下游为不锈钢制品；目前仅能证明同一中间主体的连续采购与供货行为，不能证明中国货物原样或实质转供。" },
      { category: "综合评分", title: "候选链评分：85/100", detail: "列管身份15/15、集团关系15/20、中国上游20/25、管控后下游交易25/25、产品连续性10/15。未达到90分闭环阈值。" },
    ],
    gaps: ["取得MKA物料清单和批次对应关系", "核对中国进口件是否用于Cubic订单", "取得采购订单、发票、原产地证及提单号"],
  },
];
const screeningScoreByEntity = new Map(
  screeningCases.map((item) => [item.entityId, Number(item.confidence.match(/(\d+)分/)?.[1] || 0)]),
);
const delay = (index: number) => ({ "--delay": `${Math.min(index * 70, 560)}ms` } as CSSProperties);
const segmentGap = 0.65;
let donutCursor = 0;
const donutSegments = regionData.map((item) => {
  const start = donutCursor;
  const end = start + item.share;
  donutCursor = end;
  return `${regionColor[item.name]} ${start}% ${Math.max(start, end - segmentGap)}%, transparent ${Math.max(start, end - segmentGap)}% ${end}%`;
});
const donutStyle = {
  background: `conic-gradient(from -90deg, ${donutSegments.join(", ")})`,
} as CSSProperties;

const menuGroups: Array<{
  id: MenuId;
  label: string;
  eyebrow: string;
  views: View[];
  items: Array<{ view: View; label: string; note: string }>;
}> = [
  {
    id: "entities",
    label: "实体情报",
    eyebrow: "ENTITY INTELLIGENCE",
    views: ["entities"],
    items: [
      { view: "entities", label: "管制企业清单", note: `${regulatoryEntities.length}个多类型列名实体` },
    ],
  },
  {
    id: "policy",
    label: "政策追踪",
    eyebrow: "POLICY TRACKING",
    views: ["notices", "timeline"],
    items: [
      { view: "notices", label: "公告库", note: "商务部官方公告原文" },
      { view: "timeline", label: "政策时间轴", note: "名单扩围与制度演进" },
    ],
  },
  {
    id: "research",
    label: "穿透研判",
    eyebrow: "TRADE PENETRATION",
    views: ["screening"],
    items: [
      { view: "screening", label: "替代进口排查", note: "管控后交易延续线索" },
    ],
  },
];

export default function Home() {
  const [activeView, setActiveView] = useState<View>("home");
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部地区");
  const [year, setYear] = useState("全部年份");
  const [entityKind, setEntityKind] = useState("全部主体");
  const [regulationType, setRegulationType] = useState("全部管制类型");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpenMenu(null);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return regulatoryEntities.filter(
      (item) =>
        (!q || `${item.nameCn} ${item.nameEn} ${item.notice} ${item.regulationTypes.join(" ")}`.toLowerCase().includes(q)) &&
        (region === "全部地区" || item.region === region) &&
        (year === "全部年份" || item.effectiveDate.startsWith(year)) &&
        (entityKind === "全部主体" || item.entityType === entityKind) &&
        (regulationType === "全部管制类型" || item.regulationTypes.includes(regulationType as RegulationType)),
    );
  }, [query, region, year, entityKind, regulationType]);

  const pageSize = 15;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectView = (view: View) => {
    setActiveView(view);
    setOpenMenu(null);
    setPage(1);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const drilldownEntities = (next: { region?: string; regulationType?: RegulationType }) => {
    setQuery("");
    setYear("全部年份");
    setEntityKind("全部主体");
    setRegion(next.region || "全部地区");
    setRegulationType(next.regulationType || "全部管制类型");
    selectView("entities");
  };

  return (
    <main className="site-frame">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />

      <header className="topbar">
        <div className="header-shell">
          <nav className="primary-nav" aria-label="主要导航">
            <button className={`nav-home ${activeView === "home" ? "active" : ""}`} onClick={() => selectView("home")}>
              首页
            </button>
            {menuGroups.map((group) => (
              <div
                className="nav-group"
                key={group.id}
                onMouseEnter={() => setOpenMenu(group.id)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  className={`nav-trigger ${group.views.includes(activeView) ? "active" : ""}`}
                  aria-expanded={openMenu === group.id}
                  aria-haspopup="menu"
                  onClick={() => setOpenMenu(group.id)}
                >
                  {group.label}
                </button>
                {openMenu === group.id && (
                  <div className="nav-dropdown" role="menu">
                    <div className="dropdown-kicker">{group.eyebrow}</div>
                    {group.items.map((item) => (
                      <button role="menuitem" key={item.view} onClick={() => selectView(item.view)}>
                        <div><strong>{item.label}</strong><small>{item.note}</small></div>
                        <b>↗</b>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="asof"><i /> 数据更新至 2026.08.26</div>
        </div>
      </header>

      {openMenu && <button className="menu-scrim" onClick={() => setOpenMenu(null)} aria-label="关闭导航菜单" />}

      {activeView === "home" ? (
        <HomeDashboard onSelect={selectView} onDrilldown={drilldownEntities} />
      ) : (
        <section className="content shell" id="workspace">
          {activeView === "entities" && (
            <EntityRegistry
              query={query}
              region={region}
              year={year}
              entityKind={entityKind}
              regulationType={regulationType}
              filtered={filtered}
              visible={visible}
              page={page}
              pages={pages}
              currentPage={currentPage}
              setPage={setPage}
              changeFilter={changeFilter}
              setQuery={setQuery}
              setRegion={setRegion}
              setYear={setYear}
              setEntityKind={setEntityKind}
              setRegulationType={setRegulationType}
            />
          )}
          {activeView === "notices" && <NoticeModule />}
          {activeView === "timeline" && <TimelineModule />}
          {activeView === "screening" && <ScreeningModule />}
        </section>
      )}

    </main>
  );
}

function HomeDashboard({ onSelect, onDrilldown }: { onSelect: (view: View) => void; onDrilldown: (next: { region?: string; regulationType?: RegulationType }) => void }) {
  return (
    <>
      <section className="home-hero shell">
        <div className="hero-copy">
          <h1>中国出口管制<br /><em>实体与政策情报台</em></h1>
          <p className="hero-slogan"><span>对象识别</span><i /><span>关系穿透</span></p>
        </div>
      </section>

      <section className="stats-strip shell" aria-label="整体数据统计">
        <StatCard value={String(regulatoryEntities.length)} label="多类型列名实体" note="Unique entries" index="01" />
        <StatCard value={String(companyCount)} label="商业主体" note="Companies" index="02" />
        <StatCard value={String(institutionCount)} label="机构 / 单位" note="Institutions" index="03" />
        <StatCard value={String(notices.length)} label="公告批次" note="Official notices" index="04" />
      </section>

      <section className="home-grid shell">
        <CountryPanel onDrilldown={(region) => onDrilldown({ region })} />
        <RegulationPanel onDrilldown={(regulationType) => onDrilldown({ regulationType })} />
        <article className="signal-panel">
          <div className="panel-heading"><div><span>LATEST SIGNALS</span><h2>最新政策信号</h2></div><button onClick={() => onSelect("notices")}>全部公告 ↗</button></div>
          <div className="latest-list">
            {notices.slice(0, 3).map((notice, index) => (
              <a href={notice.url} target="_blank" rel="noreferrer" key={`${notice.notice}-${notice.regulationType}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><time>{notice.date}</time><strong>{notice.notice}</strong><small><RegulationBadge type={notice.regulationType} />{notice.region} · 新增 {notice.count} 个实体</small></div>
                <b>↗</b>
              </a>
            ))}
          </div>
          <div className="signal-foot"><i /><span>政策信号持续监测</span><small>LIVE MONITORING</small></div>
        </article>
      </section>

    </>
  );
}

function StatCard({ value, label, note, index }: { value: string; label: string; note: string; index: string }) {
  return <article className="stat-card"><span>{index}</span><div><strong>{value}</strong><b>{label}</b><small>{note}</small></div></article>;
}

function RegulationBadge({ type }: { type: RegulationType }) {
  return <span className={`regulation-badge ${regulationTone[type]}`}>{type}</span>;
}

function CountryPanel({ onDrilldown }: { onDrilldown: (region: string) => void }) {
  return (
    <article className="country-panel">
      <div className="panel-heading"><div><span>GEOGRAPHIC EXPOSURE</span><h2>国家 / 地区分布</h2></div><small>点击下钻</small></div>
      <div className="country-visual">
        <div className="donut-shell" role="group" aria-label="按国家或地区下钻实体清单">
          <div className="donut-halo" />
          <div className="donut-radar" />
          <div className="donut" style={donutStyle} />
          {regionData.map((item) => <button type="button" className={`donut-action ${item.tone}`} style={{ "--angle": `${item.angle}deg` } as CSSProperties} onClick={() => onDrilldown(item.name)} aria-label={`查看${item.name}${item.count}个实体`} title={`查看${item.name}实体`} key={item.name}><span>{item.name}</span></button>)}
          <div className="donut-core"><small>GEO NODES</small><strong>{String(regionData.length).padStart(2, "0")}</strong><span>区域覆盖</span></div>
        </div>
        <div className="country-legend">
          {regionData.map((item) => (
            <button type="button" onClick={() => onDrilldown(item.name)} aria-label={`下钻查看${item.name}实体`} key={item.name}>
              <i className={item.tone} /><span>{item.name}</span><strong>{item.count}</strong><small>{item.share.toFixed(1)}%</small>
              <em><b className={item.tone} style={{ width: `${item.share}%` }} /></em>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function RegulationPanel({ onDrilldown }: { onDrilldown: (type: RegulationType) => void }) {
  const descriptions: Record<RegulationType, string> = {
    管控名单: "两用物项原则禁止出口，特殊情形须申请许可",
    不可靠实体: "涉及进出口、投资或交易合作等限制措施",
    关注名单: "强化最终用户与最终用途审查",
  };
  return <article className="regulation-panel">
    <div className="panel-heading"><div><span>REGULATORY MIX</span><h2>管制类型构成</h2></div><small>点击筛选</small></div>
    <div className="regulation-visual" aria-label="管制类型实体数量">
      {regulationData.map((item, index) => <button type="button" className={regulationTone[item.name]} onClick={() => onDrilldown(item.name)} style={{ "--delay": `${index * 90}ms`, "--bar": `${(item.count / maxRegulationCount) * 100}%`, "--reg-color": item.color } as CSSProperties} key={item.name}>
        <div><RegulationBadge type={item.name} /><strong>{item.count}</strong></div>
        <p>{descriptions[item.name]}</p>
        <em><i /></em>
      </button>)}
    </div>
    <div className="regulation-note"><i /><span>同一实体可能同时属于多个类别，图形按类别关系计数。</span></div>
  </article>;
}

function EntityRegistry(props: {
  query: string; region: string; year: string; entityKind: string; regulationType: string; filtered: RegulatoryEntity[]; visible: RegulatoryEntity[];
  page: number; pages: number; currentPage: number; setPage: (value: number | ((page: number) => number)) => void;
  changeFilter: (setter: (value: string) => void, value: string) => void;
  setQuery: (value: string) => void; setRegion: (value: string) => void; setYear: (value: string) => void; setEntityKind: (value: string) => void; setRegulationType: (value: string) => void;
}) {
  const { query, region, year, entityKind, regulationType, filtered, visible, page, pages, currentPage, setPage, changeFilter, setQuery, setRegion, setYear, setEntityKind, setRegulationType } = props;
  return <div className="module-panel">
    <div className="filters">
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => changeFilter(setQuery, event.target.value)} placeholder="搜索中文名、英文名或公告号" /></label>
      <select aria-label="地区" value={region} onChange={(event) => changeFilter(setRegion, event.target.value)}>{["全部地区", ...regionData.map((item) => item.name)].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="年份" value={year} onChange={(event) => changeFilter(setYear, event.target.value)}>{["全部年份", "2025", "2026"].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="主体属性" value={entityKind} onChange={(event) => changeFilter(setEntityKind, event.target.value)}>{["全部主体", "企业", "机构/单位"].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="管制类型" value={regulationType} onChange={(event) => changeFilter(setRegulationType, event.target.value)}>{["全部管制类型", ...regulationTypes].map((option) => <option key={option}>{option}</option>)}</select>
    </div>
    <div className="table-card">
      <div className="table-meta"><span>检索结果 <b>{filtered.length}</b> 条</span><span>官方公告来源已逐条关联</span></div>
      <div className="table-scroll"><table><thead><tr><th>序号</th><th>实体名称</th><th>国家 / 地区</th><th>管制类型</th><th>主体属性</th><th>生效日</th><th>公告批次</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td className="muted">{String(item.id).padStart(3, "0")}</td><td><a className="entity-name" href={item.sourceUrl} target="_blank" rel="noreferrer"><strong>{item.nameCn}</strong><span>{item.nameEn}</span></a></td><td><span className={`tag ${regionTone[item.region]}`}>{item.region}</span></td><td><div className="regulation-badge-row">{item.regulationTypes.map((itemType) => <RegulationBadge type={itemType} key={itemType} />)}</div></td><td>{item.entityType}</td><td className="mono">{item.effectiveDate}</td><td>{item.notice}</td><td><a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.notice}`}>↗</a></td></tr>)}</tbody></table></div>
      <div className="pager"><span>第 {currentPage} / {pages} 页</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← 上一页</button><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>下一页 →</button></div></div>
    </div>
  </div>;
}

function NoticeModule() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部管制类型");
  const [regionFilter, setRegionFilter] = useState("全部地区");
  const [yearFilter, setYearFilter] = useState("全部年份");
  const filteredNotices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((notice) =>
      (!q || `${notice.notice} ${notice.region} ${notice.regulationType}`.toLowerCase().includes(q)) &&
      (typeFilter === "全部管制类型" || notice.regulationType === typeFilter) &&
      (regionFilter === "全部地区" || notice.region === regionFilter) &&
      (yearFilter === "全部年份" || notice.date.startsWith(yearFilter)),
    );
  }, [query, typeFilter, regionFilter, yearFilter]);
  const noticeRegions = Array.from(new Set(notices.map((notice) => notice.region)));
  return <div className="module-panel">
    <div className="filters notice-filters">
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公告号、地区或类别" /></label>
      <select aria-label="公告管制类型" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>{["全部管制类型", ...regulationTypes].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="公告地区" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>{["全部地区", ...noticeRegions].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="公告年份" value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>{["全部年份", "2025", "2026"].map((option) => <option key={option}>{option}</option>)}</select>
    </div>
    <div className="module-result-meta">当前显示 <b>{filteredNotices.length}</b> 个公告批次</div>
    {filteredNotices.length > 0 ? <div className="notice-grid">{filteredNotices.map((notice, index) => <article className={`notice-card reveal ${regulationTone[notice.regulationType]}`} style={{ ...delay(index), "--tag": regulationColor[notice.regulationType] } as CSSProperties} key={`${notice.notice}-${notice.regulationType}`}><div className="notice-top"><div><span className={`tag ${regionTone[notice.region] || "green"}`}>{notice.region}</span><RegulationBadge type={notice.regulationType} /></div><time>{notice.date}</time></div><div className="notice-index">{String(filteredNotices.length - index).padStart(2, "0")}</div><h3>{notice.notice}</h3><p>本批次新增 <strong>{notice.count}</strong> 个{notice.regulationType}实体。</p><div className="notice-bottom"><span><b>{notice.count}</b> ENTITIES</span><a href={notice.url} target="_blank" rel="noreferrer">公告原文 ↗</a></div></article>)}</div> : <div className="filter-empty">暂无符合筛选条件的公告</div>}
  </div>;
}

function TimelineModule() {
  const descriptions: Record<RegulationType, string> = {
    管控名单: "列入出口管制管控名单，涉及两用物项出口禁止或特别许可要求。",
    不可靠实体: "列入不可靠实体清单，涉及进出口、投资及相关交易合作限制。",
    关注名单: "纳入更严格的最终用户与最终用途审查，并限制通用许可方式。",
  };
  return <div className="module-panel"><div className="timeline-track"><div className="track-line"><i /></div>{notices.map((notice, index) => <article className={`timeline-event reveal ${regulationTone[notice.regulationType]} ${index === 0 ? "latest" : ""}`} style={{ ...delay(index), "--tag": regulationColor[notice.regulationType] } as CSSProperties} key={`${notice.notice}-${notice.regulationType}`}><div className="timeline-date"><b>{notice.date.slice(5).replace("-", ".")}</b><span>{notice.date.slice(0, 4)}</span></div><div className="timeline-node"><i /><em /></div><div className="timeline-card"><div className="timeline-card-top"><span className={`tag ${regionTone[notice.region] || "green"}`}>{notice.region}</span><RegulationBadge type={notice.regulationType} /><small>+{notice.count} ENTITIES</small>{index === 0 && <b>最新</b>}</div><h3>{notice.notice}</h3><p>{descriptions[notice.regulationType]}</p><a href={notice.url} target="_blank" rel="noreferrer">查看政策原文 <span>↗</span></a></div></article>)}</div></div>;
}

const makeDefaultNodePositions = (count: number): NodePosition[] => {
  if (count <= 1) return [{ x: 50, y: 52 }];
  return Array.from({ length: count }, (_, index) => ({
    x: 16 + (68 * index) / (count - 1),
    y: count > 3 ? (index % 2 === 0 ? 44 : 60) : 52,
  }));
};

const clampPosition = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function DraggableChain({ nodes }: { nodes: ScreeningNode[] }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ index: number; pointerId: number; startX: number; startY: number; origin: NodePosition } | null>(null);
  const [positions, setPositions] = useState<NodePosition[]>(() => makeDefaultNodePositions(nodes.length));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 430 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => setCanvasSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>, index: number) => {
    if (event.button !== 0) return;
    setSelectedIndex(index);
    setDraggingIndex(index);
    dragRef.current = { index, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: positions[index] };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveNode = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || drag.pointerId !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const card = event.currentTarget;
    const edgeX = (card.offsetWidth / 2 / rect.width) * 100 + 1;
    const edgeY = (card.offsetHeight / 2 / rect.height) * 100 + 2;
    const next = {
      x: clampPosition(drag.origin.x + ((event.clientX - drag.startX) / rect.width) * 100, edgeX, 100 - edgeX),
      y: clampPosition(drag.origin.y + ((event.clientY - drag.startY) / rect.height) * 100, edgeY, 100 - edgeY),
    };
    setPositions((current) => current.map((position, index) => index === drag.index ? next : position));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setDraggingIndex(null);
  };

  const nudgeNode = (event: ReactKeyboardEvent<HTMLElement>, index: number) => {
    const step = event.shiftKey ? 3 : 1.2;
    const movement: Record<string, NodePosition> = {
      ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step },
    };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    setSelectedIndex(index);
    setPositions((current) => current.map((position, itemIndex) => itemIndex === index ? {
      x: clampPosition(position.x + delta.x, 12, 88),
      y: clampPosition(position.y + delta.y, 27, 76),
    } : position));
  };

  return <div className="chain-freeform" ref={canvasRef}>
    <div className="chain-canvas-tools">
      <span><i />拖动节点调整布局</span>
      <button type="button" onClick={() => setPositions(makeDefaultNodePositions(nodes.length))}>重置布局</button>
    </div>
    {nodes.slice(0, -1).map((node, index) => {
      const from = positions[index];
      const to = positions[index + 1];
      if (!from || !to) return null;
      const dx = ((to.x - from.x) / 100) * canvasSize.width;
      const dy = ((to.y - from.y) / 100) * canvasSize.height;
      const width = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const pending = node.connection === "pending";
      return <div key={`link-${node.stage}-${index}`}>
        <i className={`chain-dynamic-link ${pending ? "pending" : "verified"}`} style={{ left: `${from.x}%`, top: `${from.y}%`, width, transform: `rotate(${angle}deg)` }} />
        <span className={`chain-dynamic-label ${pending ? "pending" : "verified"}`} style={{ left: `${(from.x + to.x) / 2}%`, top: `${(from.y + to.y) / 2}%` }}>
          <b>{node.linkLabel || (pending ? "内部流向" : "进口记录")}</b><small>{pending ? "待核" : "已核"}</small>
        </span>
      </div>;
    })}
    {nodes.map((node, index) => {
      const position = positions[index] || makeDefaultNodePositions(nodes.length)[index];
      return <div
        className={`chain-node chain-draggable-node ${node.tone} ${selectedIndex === index ? "selected" : ""} ${draggingIndex === index ? "dragging" : ""}`}
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
        key={`${node.stage}-${node.name}`}
        role="button"
        tabIndex={0}
        aria-pressed={selectedIndex === index}
        aria-label={`${node.name}，可拖动调整位置`}
        onPointerDown={(event) => beginDrag(event, index)}
        onPointerMove={moveNode}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onFocus={() => setSelectedIndex(index)}
        onKeyDown={(event) => nudgeNode(event, index)}
      >
        <div className="drag-grip" aria-hidden="true">{Array.from({ length: 6 }, (_, dot) => <i key={dot} />)}</div>
        <header><span>{node.stage}</span><i /></header>
        <strong>{node.name}</strong><small>{node.note}</small>
        <footer><span>{node.tone === "source" ? "SOURCE" : node.tone === "alternate" ? "INTERMEDIARY" : "TARGET"}</span><b>{node.connection === "pending" ? "关系已核" : index === nodes.length - 1 ? "列名对象" : "证据可见"}</b></footer>
      </div>;
    })}
  </div>;
}

function ScreeningModule() {
  const [selectedId, setSelectedId] = useState(screeningEntities[0].id);
  const [entityMenuOpen, setEntityMenuOpen] = useState(false);
  const entity = screeningEntities.find((item) => item.id === selectedId) || screeningEntities[0];
  const currentCase = screeningCases.find((item) => item.entityId === entity.id) || screeningCases[0];
  const hasEvidence = currentCase.nodes.length > 0 && currentCase.evidence.length > 0;
  const score = screeningScoreByEntity.get(entity.id) || 0;
  const isHighConfidence = score >= 90;
  const ledger = [
    ["关系证据", "集团控制、关联公司或代理关系"],
    ["交易证据", "进口商、商品、供应商与运输记录"],
    ["时间证据", "管控前后交易连续性与主体切换"],
  ];

  return <div className="module-panel penetration-workspace">
    <div className="penetration-toolbar">
      <div className={`entity-combobox ${entityMenuOpen ? "open" : ""}`}>
        <span>选择管制企业</span>
        <button className="entity-select-trigger" aria-haspopup="listbox" aria-expanded={entityMenuOpen} onClick={() => setEntityMenuOpen((open) => !open)}>
          <span><b>{entity.nameCn}</b><small>{entity.nameEn} · {entity.regulationTypes.join(" / ")}</small></span><em className={score >= 90 ? "high" : score > 0 ? "rated" : "empty"}>{score}分</em><i>⌄</i>
        </button>
        {entityMenuOpen && <>
          <button className="entity-dropdown-scrim" aria-label="关闭企业筛选" onClick={() => setEntityMenuOpen(false)} />
          <div className="entity-card-dropdown" role="listbox" aria-label="管制企业卡片筛选">
            {screeningEntities.map((item, index) => {
              const itemScore = screeningScoreByEntity.get(item.id) || 0;
              return <button role="option" aria-selected={item.id === entity.id} className={`entity-filter-card ${item.id === entity.id ? "active" : ""}`} style={delay(index)} onClick={() => { setSelectedId(item.id); setEntityMenuOpen(false); }} key={item.id}>
                <span><strong>{item.nameCn}</strong><small>{item.nameEn}</small><em>{item.region} · {item.regulationTypes.join(" / ")}</em></span><span className={`entity-score ${itemScore >= 90 ? "high" : itemScore > 0 ? "rated" : "empty"}`}>{itemScore}分</span><i>{item.id === entity.id ? "●" : "↗"}</i>
              </button>;
            })}
          </div>
        </>}
      </div>
    </div>

    <section className="penetration-case-panel">
        <header className="case-heading">
          <div><span>替代进口排查</span><h2>{entity.nameCn}</h2><p>{entity.nameEn}</p><div className="case-regulation-row">{entity.regulationTypes.map((itemType) => <RegulationBadge type={itemType} key={itemType} />)}</div></div>
          <div className="case-heading-meta"><strong className={hasEvidence ? "positive" : "pending"}>{currentCase.finding}</strong>{hasEvidence && <b>{currentCase.confidence}</b>}<small>{entity.notice} · {entity.effectiveDate}</small><a href={entity.sourceUrl} target="_blank" rel="noreferrer">官方公告 ↗</a></div>
        </header>

        <div className={`chain-evidence-board ${hasEvidence ? "has-evidence" : "is-empty"}`}>
          <div className="chain-board-head">
            <div><strong>替代进口供应链</strong><span>SUPPLY CHAIN TRACE</span></div>
            <div className="chain-board-meta"><span>{currentCase.nodes.length} 节点</span><span>{Math.max(0, currentCase.nodes.length - 1)} 关系</span><b className={hasEvidence ? "signal-on" : "signal-off"}>{isHighConfidence ? "高风险闭环" : hasEvidence ? "线索链路" : "未形成链路"}</b></div>
          </div>
          {hasEvidence && <div className={`chain-risk-note ${isHighConfidence ? "high-confidence" : ""}`}><p>{currentCase.summary}</p><span>{isHighConfidence ? "达到90分排查阈值 · 不等同于违法定性" : "当前为风险线索，尚未形成最终用途闭环。"}</span></div>}
          <div className="chain-canvas">
            {hasEvidence ? <DraggableChain key={currentCase.entityId} nodes={currentCase.nodes} /> : <div className="chain-empty-state">
              <div className="empty-radar"><i /><span /><b /></div>
              <h3>暂未发现替代供应链</h3>
              <p>{currentCase.summary}</p>
              <ul>{currentCase.checks.map((item) => <li key={item}><i />{item}</li>)}</ul>
            </div>}
          </div>
        </div>

        <div className="penetration-ledger-grid">
          <article className="evidence-ledger">
            <header><strong>证据台账</strong><b>{currentCase.evidence.length} 条</b></header>
            {hasEvidence ? <div>{currentCase.evidence.map((item) => <section key={`${item.category}-${item.title}`}><i /><div><span>{item.category}</span><strong>{item.title}</strong><p>{item.detail}</p>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.source || "查看来源"} ↗</a> : item.source ? <small className="evidence-source">{item.source}</small> : null}</div></section>)}</div> : <div className="ledger-empty">{ledger.map(([title, note]) => <section key={title}><i /><div><strong>{title}</strong><p>{note}</p></div><span>待补证</span></section>)}</div>}
          </article>
          <article className="verification-gaps">
            <header><strong>尚待核实</strong><b>{currentCase.gaps.length}</b></header>
            <p>{isHighConfidence ? "当前链路已达到高风险排查阈值；是否构成违规仍取决于物项归类、原产地证明与许可证状态。" : hasEvidence ? "当前链路仅用于风险排序；在内部流向闭合前，不认定为已证实替代进口。" : "“暂未发现”仅表示当前证据库未形成可报告链路，不等同于不存在相关交易。"}</p>
            <ol>{currentCase.gaps.map((gap) => <li key={gap}><i />{gap}</li>)}</ol>
          </article>
        </div>
      </section>
  </div>;
}
