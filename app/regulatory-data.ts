export type RegulationType = "管控名单" | "不可靠实体" | "关注名单";

export type SupplementalEntity = {
  id: number;
  notice: string;
  noticeOrder: number;
  effectiveDate: string;
  region: string;
  nameCn: string;
  nameEn: string;
  entityType: "企业" | "机构/单位";
  sourceUrl: string;
  regulationTypes: RegulationType[];
};

export type SupplementalNotice = {
  date: string;
  notice: string;
  region: string;
  count: number;
  url: string;
  regulationType: RegulationType;
};

export type SupplementalRegulationRecord = {
  regulationType: RegulationType;
  notice: string;
  effectiveDate: string;
  sourceUrl: string;
};

export const unreliableEntityIds = new Set([
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 48, 49, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 64, 65, 66, 67, 68, 69, 70, 71, 80, 81,
]);

const attentionFebruaryUrl = "https://www.mofcom.gov.cn/zcfb/blgg/art/2026/art_cfacd88ebce04b4c8c55e2048b2ef088.html";
const attentionJuneUrl = "https://www.mofcom.gov.cn/zfxxgk/gkml/art/2026/art_9f099c6e90f444638ea96713d33bbbf9.html";
const unreliableFebruaryUrl = "https://www.mofcom.gov.cn/cms_files/filemanager/policySummary/viewcore_ab15d2258dda4e93b8ad1ec4776d37c3.html";
const unreliableOctoberUrl = "https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/dwmygl/art/2025/art_772e09bfe5af4ed88e0cb08c63c36aa7.html";

export const supplementalRegulationRecordsByEntityId = new Map<number, SupplementalRegulationRecord[]>([
  [43, [{
    regulationType: "不可靠实体",
    notice: "不可靠实体清单工作机制公告2025年第10号",
    effectiveDate: "2025-10-09",
    sourceUrl: unreliableOctoberUrl,
  }]],
]);

const attentionFebruary = [
  ["斯巴鲁株式会社", "SUBARU Corporation", "企业"],
  ["富士航空航天技术株式会社", "FUJI Aerospace Technology Co., Ltd.", "企业"],
  ["引能仕株式会社", "ENEOS Corporation", "企业"],
  ["运输机工业株式会社", "Yusoki Co., Ltd.", "企业"],
  ["伊藤忠航空株式会社", "ITOCHU Aviation Co., Ltd.", "企业"],
  ["俪达集团控股股份有限公司", "Leda Group Holdings Co., Ltd.", "企业"],
  ["东京科学大学", "Institute of Science Tokyo", "机构/单位"],
  ["三菱材料株式会社", "Mitsubishi Materials Corporation", "企业"],
  ["ASPP株式会社", "ASPP Co., Ltd.", "企业"],
  ["八洲电机株式会社", "Yashima Denki Co., Ltd.", "企业"],
  ["住友重机械工业株式会社", "Sumitomo Heavy Industries, Ltd.", "企业"],
  ["TDK株式会社", "TDK Corporation", "企业"],
  ["三井物产航空航天株式会社", "Mitsui Bussan Aerospace Co., Ltd.", "企业"],
  ["日野汽车株式会社", "Hino Motors, Ltd.", "企业"],
  ["东金株式会社", "Tokin Corporation", "企业"],
  ["日新电机株式会社", "Nissin Electric Co., Ltd.", "企业"],
  ["三泰克托株式会社", "Sun Tectro Co., Ltd.", "企业"],
  ["日东电工株式会社", "Nitto Denko Corporation", "企业"],
  ["日油株式会社", "NOF Corporation", "企业"],
  ["半井试剂株式会社", "Nacalai Tesque, Inc.", "企业"],
] as const;

const attentionJune = [
  ["三井E&S株式会社", "MITSUI E&S Co., Ltd.", "企业"],
  ["三井物产航空航天株式会社维修中心", "Mitsui Bussan Aerospace Co., Ltd. Maintenance Center", "企业"],
  ["泰拉无人机株式会社", "Terra Drone Corporation", "企业"],
  ["ACSL株式会社", "ACSL Ltd.", "企业"],
  ["三菱原子燃料株式会社", "Mitsubishi Nuclear Fuel Co., Ltd.", "企业"],
  ["日本原燃株式会社", "Japan Nuclear Fuel Limited", "企业"],
  ["富士通网络解决方案株式会社", "Fujitsu Network Solutions Limited", "企业"],
  ["日立高端系统株式会社", "Hitachi Advanced Systems Corporation", "企业"],
  ["小松产机株式会社", "Komatsu Industries Corporation", "企业"],
  ["小松NTC株式会社", "Komatsu NTC Ltd.", "企业"],
  ["冲电气工业株式会社", "OKI Electric Industry Co., Ltd.", "企业"],
  ["OKI通信回声株式会社", "OKI Com-Echoes Co., Ltd.", "企业"],
  ["OKI电路技术株式会社", "OKI Circuit Technology Co., Ltd.", "企业"],
  ["OKI奈克斯泰克株式会社", "OKI Nextech Co., Ltd.", "企业"],
  ["冲电气工程株式会社", "OKI Engineering Co., Ltd.", "企业"],
  ["YDK科技株式会社", "YDK Technologies Co., Ltd.", "企业"],
  ["日本电磁测器株式会社", "Nihon Denji Sokki Co., Ltd", "企业"],
  ["丰和工业株式会社", "Howa Machinery, Ltd.", "企业"],
  ["细谷火工株式会社", "Hosoya Pyro-Engineering Co., Ltd.", "企业"],
  ["藤仓航装株式会社", "The Fujikura Parachute Co., Ltd.", "企业"],
] as const;

const unreliableExtras = [
  ["美国PVH集团", "PVH Corp.", "美国", "企业", "不可靠实体清单工作机制公告2025年第4号", "2025-02-04", unreliableFebruaryUrl],
  ["因美纳公司", "Illumina, Inc.", "美国", "企业", "不可靠实体清单工作机制公告2025年第4号", "2025-02-04", unreliableFebruaryUrl],
  ["反无人机技术公司", "Dedrone by Axon", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["迪杰恩技术公司", "DZYNE Technologies", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["埃比特系统美国分公司", "Elbit Systems of America, LLC", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["伊比鲁斯公司", "Epirus, Inc.", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["Exelis公司", "Exelis Inc.", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["联合技术系统运营公司", "Alliant Techsystems Operations LLC", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["贝宜系统股份有限公司", "BAE Systems, Inc.", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["Teledyne FLIR公司", "Teledyne FLIR, LLC", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["VSE公司", "VSE Corporation", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["立方全球防务公司", "Cubic Global Defense", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["Recorded Future公司", "Recorded Future, Inc.", "美国", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["哈利法克斯国际安全论坛", "Halifax International Security Forum", "加拿大", "机构/单位", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
  ["TechInsights公司及其分支机构", "TechInsights Inc. and its branches", "加拿大", "企业", "不可靠实体清单工作机制公告2025年第10号", "2025-10-09", unreliableOctoberUrl],
] as const;

export const supplementalEntities: SupplementalEntity[] = [
  ...attentionFebruary.map(([nameCn, nameEn, entityType], index) => ({
    id: 154 + index,
    notice: "商务部公告2026年第12号",
    noticeOrder: index + 1,
    effectiveDate: "2026-02-24",
    region: "日本",
    nameCn,
    nameEn,
    entityType,
    sourceUrl: attentionFebruaryUrl,
    regulationTypes: ["关注名单" as const],
  })),
  ...attentionJune.map(([nameCn, nameEn, entityType], index) => ({
    id: 174 + index,
    notice: "商务部公告2026年第28号",
    noticeOrder: index + 1,
    effectiveDate: "2026-06-29",
    region: "日本",
    nameCn,
    nameEn,
    entityType,
    sourceUrl: attentionJuneUrl,
    regulationTypes: ["关注名单" as const],
  })),
  ...unreliableExtras.map(([nameCn, nameEn, region, entityType, notice, effectiveDate, sourceUrl], index) => ({
    id: 194 + index,
    notice,
    noticeOrder: index + 1,
    effectiveDate,
    region,
    nameCn,
    nameEn,
    entityType,
    sourceUrl,
    regulationTypes: ["不可靠实体" as const],
  })),
];

export const supplementalNotices: SupplementalNotice[] = [
  { date: "2025-01-02", notice: "不可靠实体清单工作机制公告2025年第1号", region: "美国", count: 10, regulationType: "不可靠实体", url: "https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/blgg/art/2025/art_6e1217f441484854ae912407ecc1fa19.html" },
  { date: "2025-01-14", notice: "不可靠实体清单工作机制公告2025年第2号", region: "美国", count: 7, regulationType: "不可靠实体", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_6f2746183a8940c5aa49b39ccde50526.html" },
  { date: "2025-01-15", notice: "不可靠实体清单工作机制公告2025年第3号", region: "美国", count: 4, regulationType: "不可靠实体", url: "https://www.mofcom.gov.cn/zfxxgk/gkml/art/2025/art_6e8e95805f9c4d0282f02792a2a967f5.html" },
  { date: "2025-02-04", notice: "不可靠实体清单工作机制公告2025年第4号", region: "美国", count: 2, regulationType: "不可靠实体", url: unreliableFebruaryUrl },
  { date: "2025-03-04", notice: "不可靠实体清单工作机制公告2025年第5号", region: "美国", count: 10, regulationType: "不可靠实体", url: "https://www.mofcom.gov.cn/zcfb/zc/art/2025/art_e6c07d5fe93d428e9e1e83de15afa38f.html" },
  { date: "2025-04-04", notice: "不可靠实体清单工作机制公告2025年第7号", region: "美国", count: 11, regulationType: "不可靠实体", url: "https://12335.mofcom.gov.cn/articledwmy/zcxx/dwmy/202504/1941257_1.html" },
  { date: "2025-04-09", notice: "不可靠实体清单工作机制公告2025年第8号", region: "美国", count: 6, regulationType: "不可靠实体", url: "https://exportcontrol.mofcom.gov.cn/article/zcfg/gnzcfg/zcfggzqd/202504/1134.html" },
  { date: "2025-09-25", notice: "不可靠实体清单工作机制公告2025年第9号", region: "美国", count: 3, regulationType: "不可靠实体", url: "https://aqygzj.mofcom.gov.cn/flzc/gzjgfxwj/art/2025/art_f7201e9ac9864599bd43ed65a3257577.html" },
  { date: "2025-10-09", notice: "不可靠实体清单工作机制公告2025年第10号", region: "美国/加拿大", count: 14, regulationType: "不可靠实体", url: unreliableOctoberUrl },
  { date: "2026-02-24", notice: "商务部公告2026年第12号", region: "日本", count: 20, regulationType: "关注名单", url: attentionFebruaryUrl },
  { date: "2026-06-29", notice: "商务部公告2026年第28号", region: "日本", count: 20, regulationType: "关注名单", url: attentionJuneUrl },
];
