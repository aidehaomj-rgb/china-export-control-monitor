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
const screeningEntityIds = [1, 2, 3, 4, 5, 29, 33, 53, 55, 195, 203];
const screeningEntities = regulatoryEntities.filter((item) => screeningEntityIds.includes(item.id));
const screeningCases: ScreeningCase[] = [
  {
    entityId: 1,
    finding: "单腿异常 · 关联主体",
    confidence: "B级 · 80分",
    summary: "列管后，General Dynamics旗下NASSCO继续接收中国供应商的船用阀门与控制舱舷梯部件，集团关系与中国来源记录均已确认；但尚未建立管控前同类货物直供基线，也未发现经独立中间实体转供的第二腿，因此按新标准降为80分。",
    checks: ["General Dynamics / NASSCO法定名称与集团关系", "2024-08-20至2026-08-20两年数据", "中国原产筛选与206条基准结果", "管控前同类货物基线与路径切换"],
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
      { category: "综合评分", title: "关联主体单腿评分：80/100", detail: "列管身份15/15、集团关系20/20、中国来源20/25、管控后交易20/20、管控前基线及路径切换5/20。现有证据说明列管后关联业务单元继续进口，但尚未达到90分双腿闭环阈值。" },
    ],
    gaps: ["补齐列管前同类阀门及结构件的直接进口基线", "取得原始提单号、商业发票与原产地证", "核对具体舰船项目、物项编码与许可证状态"],
  },
  {
    entityId: 2,
    finding: "高可信前后延续链",
    confidence: "A级 · 98分",
    summary: "管控前，Lineage Power China上海工厂向L3Harris交付电源；该制造主体在列管前更名为OmniOn Power Shanghai，列管后又以新名称向同一收货主体交付同为72件、777千克的电源，形成供应商继受型前后闭环。",
    checks: ["L3Harris Technologies与L. Harris历史报关名称", "Lineage Power China至OmniOn Power Shanghai主体变更", "管控前后商品、数量与重量对照", "Kopplen、Fabricators等非关联通道补查"],
    nodes: [
      { stage: "管控前中国供应商", name: "Lineage Power China Shanghai", note: "2023-04-18交付POWER SUPPLY；72箱、777千克", tone: "source", connection: "verified", linkLabel: "制造主体变更" },
      { stage: "继受制造主体", name: "OmniOn Power Shanghai Co., Ltd.", note: "认证文件确认由Lineage Power China变更而来", tone: "alternate", connection: "verified", linkLabel: "管控后直供" },
      { stage: "列名收货实体", name: "L3Harris Technologies Inc.", note: "美国收货人；2025-01-02起列入管控名单", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "L3Harris自2025年1月2日起列入管控名单", detail: "商务部公告2025年第1号将L3哈里斯公司列入出口管制管控名单，相关出口活动应当立即停止；特殊情况需申请许可。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/dwmygl/art/2025/art_c14d6b7d45e247c596f4d3ecdda9b291.html" },
      { category: "管控前基线", title: "Lineage Power China向L3Harris直供电源", detail: "2023-04-18，Lineage Power China Shanghai向L. Harris/L3Harris交付POWER SUPPLY，72箱、777千克，起运地和原产地均指向中国。", source: "ImportGenius · 美国海关记录", url: "https://www.importgenius.com/suppliers/lineage-power-china-shanghai" },
      { category: "主体继受", title: "Lineage Power China变更为OmniOn Power Shanghai", detail: "OmniOn官方安全认证文件记录制造商名称由Lineage Power China Co., Ltd.变更为OmniOn Power Shanghai Co., Ltd.，变更日期为2024-03-18，早于L3Harris列管日。", source: "OmniOn Power 官方认证", url: "https://www.omnionpower.com/assets/pdfs/windchill/quality-safety/kc_certificate_car2512tebcrz01a_omnion-power.pdf" },
      { category: "管控后交易", title: "新名称主体继续交付同规格电源", detail: "2025-02-23，OmniOn Power Shanghai向L3Harris交付POWER SUPPLY/CONTAINER POWER SUPPLY，72件、777千克、金额15,540美元；商品、数量和重量与管控前记录高度一致。", source: "易迅数据 · 美国进口记录 · 2026-08-26复核" },
      { category: "非关联通道", title: "Kopplen在列管前后交付同一L3Harris料号", detail: "2024-10-09与2025-07-21记录均为P/N 14050-6100-01外置扬声器、1440件/72箱；该通道产品连续性很强，但尚缺中国工厂至香港主体的A腿单证，单独评分89分。", source: "ImportGenius · Kopplen美国提单", url: "https://www.importgenius.com/suppliers/kopplen-electronics-limited" },
      { category: "单腿候选", title: "Fabricators三票车载充电器尚未形成前后闭环", detail: "列管后可见2025-06-30、11-18与12-23三票车载充电器；制造资料指向东莞体系，但未检出管控前同货直供基线及中国至香港A腿。", source: "美国海关公开提单", url: "https://www.importgenius.com/importers/l3harris-technologies-inc" },
      { category: "综合评分", title: "供应商继受型闭环：98/100", detail: "列管身份15/15、管控前中国直供20/20、主体继受20/20、管控后交易25/25、商品与数量重量匹配18/20。高分用于排查排序，不代表规避管控或违法认定。" },
    ],
    gaps: ["取得管控前后72件电源的型号、序列号及商业发票", "补齐Kopplen与Fabricators中国工厂至香港主体的A腿单证", "按中国两用物项清单核定电源及通信附件的管制编码与许可证状态"],
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
    finding: "高风险延续链 · 待补基线",
    confidence: "B级 · 88分",
    summary: "列管后，Leidos安检设备子公司继续从天津接收CT机架，列名身份、子公司关系、中国来源和管控后交易均较清晰；但现有材料尚未逐票证明管控前记录也是同一供应商、同一货物，也没有独立中间实体构成完整双腿路径，因此按新标准调整为88分。",
    checks: ["LEIDOS与法定子公司名称双口径", "易迅实际断词AUTOMAT ION补查", "天津Schleifring供应商反向检索", "管控前8条记录的供应商与货物逐票匹配"],
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
      { category: "综合评分", title: "高风险延续链评分：88/100", detail: "列管身份15/15、集团关系20/20、中国来源25/25、管控后交易20/20、管控前基线及路径切换8/20。需逐票闭合管控前同类货物基线后，方可进入90分以上区间。" },
    ],
    gaps: ["逐票核实管控前8条记录是否为同一供应商与同类CT设备", "取得原始提单号和商业发票", "核验物项编码及2026年业务重组后的实际收货主体"],
  },
  {
    entityId: 33,
    finding: "单腿异常 · 待补A腿",
    confidence: "C级 · 68分",
    summary: "列管后检出两票由越南包装企业发往Skydio、原产地字段标注China的包装物，但对两家越南企业分别开展来货查询均为0条，未补出中国至越南A腿，也没有管控前中国直供同类包装基线。",
    checks: ["SKYDIO INC两年基准与中国来源筛选", "Super Bold Vietnam来货查询：0条", "J Packaging Vina来货查询：0条", "管控前同类包装直供基线"],
    nodes: [
      { stage: "待证中国上游", name: "包装材料与组件", note: "仅美国端原产地字段标注China；实际生产企业待证", tone: "source", connection: "pending", linkLabel: "A腿缺失" },
      { stage: "越南发货主体", name: "Super Bold Vietnam / J Packaging Vina", note: "两家来货查询均未返回可见记录", tone: "alternate", connection: "verified", linkLabel: "B腿已见" },
      { stage: "列名收货实体", name: "Skydio, Inc.", note: "美国进口商；2025-03-04起列名", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Skydio自2025年3月4日起列名", detail: "商务部公告2025年第13号将斯凯迪奥公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_39c51608fa5c40ee833f984cfcc24abe.html" },
      { category: "易迅验证", title: "718条基准记录中筛得2条中国来源", detail: "查询条件：采购商SKYDIO INC，时间2024-08-20至2026-08-20；基准718条，中国来源2条，香港来源0条。", source: "易迅数据 · 美国进口记录 · 2026-08-25核验" },
      { category: "交易证据", title: "越南供应商向Skydio交付中国来源包装组件", detail: "2026-05-05，Super Bold (Vietnam) Packaging交付57件、1,819千克；2026-04-21，J Packaging Vina交付126件、716千克。易迅原产地均标注China。", source: "易迅数据 · 中国原产筛选" },
      { category: "A腿排查", title: "两家越南发货企业均未检出可见来货", detail: "以SUPER BOLD (VIETNAM) PACKAGING与J PACKAGING VINA COMPANY LIMITED为采购商开展两年全来源补查，均返回0条；受数据库覆盖限制，0条不等于现实中无采购。", source: "易迅数据 · 2026-08-26复核" },
      { category: "证据边界", title: "产品为包装材料且缺管控前基线", detail: "货描为纸托、板材、保护角、塑料卡扣和瓦楞箱；未检出管控前中国直供同类包装，也不能推断进入无人机核心系统。" },
      { category: "综合评分", title: "单腿异常评分：68/100", detail: "列管身份15/15、美国端中国原产字段18/25、境外发货主体15/20、列管后B腿15/20、A腿及管控前基线5/20。未达到90分闭环阈值。" },
    ],
    gaps: ["取得越南供应商采购发票与原产地证", "补查越南语法定名称、地址及报关别名", "确认包装组件是否随整机或备件项目配套"],
  },
  {
    entityId: 53,
    finding: "单腿异常 · 关联主体",
    confidence: "B级 · 76分",
    summary: "列管后可见马来西亚Oceaneering Solus向美国列名实体交付一台中国原产自动驾驶人员运输车，且历史SEC文件支持关联关系；但尚未检出中国至马来西亚A腿，也缺管控前同类车辆直供基线。",
    checks: ["OCEANEERING INTERNATIONAL INC精确采购商", "中国原产字段与单票车辆记录", "Oceaneering Solus Malaysia历史股权关系", "中国至马来西亚A腿与管控前车辆基线"],
    nodes: [
      { stage: "待证中国上游", name: "GRT People Mover Pilot Autonomous Vehicle", note: "美国端原产地字段标注China；中国生产与出境单证待补", tone: "source", connection: "pending", linkLabel: "A腿缺失" },
      { stage: "关联发货主体", name: "Oceaneering Solus (Malaysia) Sdn Bhd", note: "SEC历史披露49%持股；当前股权待刷新", tone: "alternate", connection: "verified", linkLabel: "B腿已见" },
      { stage: "列名收货实体", name: "Oceaneering International, Inc.", note: "美国进口商；2025-04-04起列名", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Oceaneering International自2025年4月4日起列名", detail: "商务部公告2025年第21号将国际海洋工程公司列入出口管制管控名单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_210b619d46384bcdbbc5265ca74c5412.html" },
      { category: "易迅验证", title: "列管后命中1条中国来源自动驾驶车辆", detail: "2026-05-04，Oceaneering Solus (Malaysia)向Oceaneering International交付1台GRT PEOPLE MOVER PILOT AUTONOMOUS VEHICLE，重量9,660千克，目的国美国、原产地China。", source: "易迅数据 · 美国进口记录 · 2026-08-25核验" },
      { category: "关系证据", title: "SEC历史披露Oceaneering Solus Malaysia关联关系", detail: "Oceaneering的SEC Exhibit 21曾列示Oceaneering Solus (Malaysia) Sdn. Bhd.及49%持股比例；最新股权与名称仍需补证。", source: "Oceaneering SEC Exhibit 21", url: "https://www.sec.gov/Archives/edgar/data/73756/000007375621000023/oii_exhibit2101x12312020.htm" },
      { category: "产品匹配", title: "车辆与集团移动机器人业务高度相关", detail: "货描直接指向自动驾驶车辆，不是普通耗材；但业务相关性不能替代中国至马来西亚的实际运输证据。", source: "Oceaneering 2025 Form 10-K", url: "https://www.sec.gov/Archives/edgar/data/73756/000007375626000016/oii-20251231.htm" },
      { category: "证据边界", title: "目前只有马来西亚至美国B腿", detail: "尚未取得中国生产商、出口报关、马来西亚进口记录或管控前同类车辆直供记录，因此不能按完整替代供应链入库。" },
      { category: "综合评分", title: "关联主体单腿评分：76/100", detail: "列管身份15/15、关联关系16/20、美国端中国原产字段18/25、列管后B腿20/20、A腿及管控前基线7/20。未达到90分闭环阈值。" },
    ],
    gaps: ["取得中国至马来西亚进口记录及原产地证", "取得2026年最新股权文件与关联交易说明", "核验车辆最终项目、物项编码与许可证状态"],
  },
  {
    entityId: 55,
    finding: "高风险候选链路",
    confidence: "B级 · 82分",
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
      { category: "综合评分", title: "候选链评分：82/100", detail: "列管身份15/15、集团关系15/20、中国上游20/25、管控后下游交易22/25、产品连续性10/15。两腿主体可见，但货物不同，未达到90分闭环阈值。" },
    ],
    gaps: ["取得MKA物料清单和批次对应关系", "核对中国进口件是否用于Cubic订单", "取得采购订单、发票、原产地证及提单号"],
  },
  {
    entityId: 195,
    finding: "单腿异常 · 字段冲突",
    confidence: "C级 · 70分",
    summary: "Illumina美国端有26条由新加坡子公司发运、原产地标注China的记录，但对Illumina Singapore的23条来货逐条复核后，仅见越南和印度来源，中国来货为0，且与美国端记录不存在相同HS编码或货描，暂不能认定为中国经新加坡转运。",
    checks: ["ILLUMINA INC美国端254条完整读取", "Illumina Singapore采购商23条完整读取", "中国至新加坡A腿筛选：0条", "两端HS编码、货描与时间交叉比对"],
    nodes: [
      { stage: "待证中国上游", name: "中国来源试剂", note: "仅美国进口端原产地字段标注China；实际中国出口记录未见", tone: "source", connection: "pending", linkLabel: "A腿未检出" },
      { stage: "新加坡关联主体", name: "Illumina Singapore Pte. Ltd.", note: "23条来货均来自越南或印度；中国来源0条", tone: "alternate", connection: "verified", linkLabel: "B腿字段冲突" },
      { stage: "列名收货实体", name: "Illumina, Inc.", note: "美国收货人；2025-02-04起列入不可靠实体清单", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Illumina自2025年2月4日起列入不可靠实体清单", detail: "不可靠实体清单工作机制公告2025年第4号将因美纳公司列入不可靠实体清单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/cms_files/filemanager/policySummary/viewcore_ab15d2258dda4e93b8ad1ec4776d37c3.html" },
      { category: "易迅验证", title: "253条唯一记录中筛得32条中国原产记录", detail: "查询条件：采购商ILLUMINA INC、2025-08-20至2026-08-20；254条原始记录、253条可见字段唯一记录。中国原产32条，日期覆盖2025-09-03至2026-08-18。", source: "易迅数据 · 2页全部读取 · 2026-08-26核验" },
      { category: "关系证据", title: "Illumina Singapore为全资新加坡子公司", detail: "Illumina 2025年度SEC Exhibit 21将Illumina Singapore Pte. Ltd.列为全资直接或间接子公司；关联关系成立，但不能替代货物A腿证据。", source: "Illumina 2025 Form 10-K · Exhibit 21", url: "https://www.sec.gov/Archives/edgar/data/1110803/000111080326000024/ex211subsidiariesfy2510-k.htm" },
      { category: "A腿反证", title: "新加坡主体23条来货中中国来源为0", detail: "完整读取ILLUMINA SINGAPORE PTE LTD两页23条记录：越南10条、印度13条，中国0条；与美国端新加坡发运记录的HS编码和货描均无精确重合。", source: "易迅数据 · 2026-08-26复核" },
      { category: "直接供应", title: "深圳Global Hi-Tek持续交付测序仪精密部件", detail: "6条唯一记录货描为CRADLE、INSEP ASSY与OPTICS PLATE，HS 902790；2026-08-18一票为73件、重量字段4,674，起运线索和供应商地址均指向深圳。", source: "美国海关公开提单", url: "https://www.importinfo.com/global-hi-tek-precision-limited" },
      { category: "证据边界", title: "直接深圳供货与新加坡路径应分开判断", detail: "6条深圳精密部件属于中国至美国直接供应；26条新加坡试剂记录则缺中国至新加坡A腿，不应合并为同一双路径闭环。" },
      { category: "综合评分", title: "字段冲突单腿评分：70/100", detail: "不可靠实体身份15/15、关联关系20/20、美国端中国原产字段15/25、列名后B腿15/20、A腿与产品重合5/20。未达到90分闭环阈值。" },
    ],
    gaps: ["取得26条新加坡发运记录的原始提单与原产地证", "核验试剂实际生产企业、批号和新加坡入库记录", "将6条深圳直接供应与新加坡路径分别核定物项属性"],
  },
  {
    entityId: 203,
    finding: "境外制造线索 · 非中国绕道",
    confidence: "C级 · 65分",
    summary: "列名后79条唯一交易中有33条来自优利德越南，但全部可见记录的原产地为越南或印度尼西亚；现有证据只能证明中资集团控制的境外制造节点向FLIR体系供货，不能证明货物自中国出口后经第三国转运。",
    checks: ["TELEDYNE FLIR LLC与FLIR SYSTEMS INC双名称", "列名后79条唯一记录逐条筛选", "优利德越南股权与33条Extech型号", "中国上游、BOM与原产地字段反证"],
    nodes: [
      { stage: "中国集团控制端", name: "Uni-Trend Technology (China) Co., Ltd.", note: "广东东莞上市公司；仅股权与研发控制证据", tone: "source", connection: "verified", linkLabel: "股权控制" },
      { stage: "境外制造节点", name: "Uni-Trend Technology (Vietnam) Co., Ltd.", note: "优利德全资孙公司；33条列名后Extech仪器发运", tone: "alternate", connection: "verified", linkLabel: "越南制造" },
      { stage: "关联收货主体", name: "Teledyne FLIR Commercial Systems, Inc.", note: "FLIR商业系统公司；列名主体历史关联进口名称", tone: "destination" },
    ],
    evidence: [
      { category: "管控基线", title: "Teledyne FLIR自2025年10月9日起列入不可靠实体清单", detail: "不可靠实体清单工作机制公告2025年第10号将Teledyne FLIR公司列入不可靠实体清单。", source: "中华人民共和国商务部", url: "https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/dwmygl/art/2025/art_772e09bfe5af4ed88e0cb08c63c36aa7.html" },
      { category: "易迅验证", title: "列名后79条唯一交易中33条来自优利德越南", detail: "TELEDYNE FLIR LLC精确名称为0条；以历史名称FLIR SYSTEMS INC补查获得142条并全部读取。列名后79条均为唯一可见记录，其中33条发货方为Uni-Trend Technology (Vietnam)，日期覆盖2026-02-09至06-29。", source: "易迅数据 · 142条全部读取 · 2026-08-26核验" },
      { category: "中资关系", title: "优利德越南为中国上市公司全资孙公司", detail: "优利德2024年年报明确将UNI-TREND TECHNOLOGY (VIETNAM) COMPANY LIMITED列为公司孙公司；公司官网同时列示东莞总部和越南工厂。", source: "优利德2024年年度报告", url: "https://big5.sse.com.cn/disclosure/listedinfo/announcement/c/new/2025-04-12/688628_20250412_HSIN.pdf" },
      { category: "收货关系", title: "FLIR Commercial Systems属于FLIR体系", detail: "FLIR历史SEC Exhibit 21将FLIR Commercial Systems, Inc.列为子公司；Teledyne随后完成对FLIR的收购并以Teledyne FLIR运营。", source: "FLIR SEC Exhibit 21", url: "https://www.sec.gov/Archives/edgar/data/354908/000035490821000016/flir-12312020x10kex211ng1.htm" },
      { category: "产品匹配", title: "33条记录直接命中Extech具体型号", detail: "货描包括SL250W声级计、MN35/MN36万用表、EX655钳形表、TG54-2红外温度计和VPC260颗粒计数器；17条目的地为美国、14条为香港、2条为中国。", source: "易迅数据 · 越南出口记录" },
      { category: "原产反证", title: "列名后记录未出现中国原产", detail: "79条列名后唯一交易的可见原产地均为Vietnam或Indonesia；中国集团股权关系不能直接推导中国货物投入或第三国转运。", source: "易迅数据 · 2026-08-26复核" },
      { category: "综合评分", title: "中资境外制造线索：65/100", detail: "不可靠实体身份15/15、FLIR关系20/20、中资股权15/20、列名后交易15/20、中国A腿及原产证据0/25。作为供应商监测线索保留，不进入90分双腿闭环。" },
    ],
    gaps: ["取得优利德越南33条货物的BOM、生产批次和中国上游采购单", "取得原始提单与最终收货仓库资料", "区分民用Extech产品与受管制物项并核验许可证状态"],
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
