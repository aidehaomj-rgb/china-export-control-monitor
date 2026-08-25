"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import data from "../public/data/control-entities.json";

type View = "home" | "entities" | "notices" | "timeline" | "screening";
type MenuId = "entities" | "policy" | "research";
type Entity = (typeof data.entities)[number];
type ScreeningNode = { stage: string; name: string; note: string; tone: "source" | "subject" | "alternate" | "destination"; connection?: "verified" | "pending" };
type ScreeningEvidence = { category: string; title: string; detail: string; source?: string; url?: string };
type ScreeningCase = { entityId: number; finding: string; confidence: string; summary: string; checks: string[]; nodes: ScreeningNode[]; evidence: ScreeningEvidence[]; gaps: string[] };

const regionTone: Record<string, string> = {
  美国: "red",
  日本: "amber",
  欧盟: "blue",
  台湾地区: "violet",
};

const regionTotal = data.entities.reduce<Record<string, number>>((acc, item) => {
  acc[item.region] = (acc[item.region] || 0) + 1;
  return acc;
}, {});

const regionData = ["美国", "日本", "欧盟", "台湾地区"].map((name) => ({
  name,
  count: regionTotal[name] || 0,
  share: ((regionTotal[name] || 0) / data.entities.length) * 100,
  tone: regionTone[name],
}));

const notices = [...data.notices].reverse();
const companyCount = data.entities.filter((item) => item.entityType === "企业").length;
const institutionCount = data.entities.length - companyCount;
const screeningEntities = data.entities.slice(0, 5);
const screeningCases: ScreeningCase[] = [
  {
    entityId: 1,
    finding: "暂未发现替代供应链",
    confidence: "—",
    summary: "当前证据库未形成通用动力通过其他主体继续自中国进口的可报告链路。",
    checks: ["General Dynamics Corporation / Company 法定名称", "Gulfstream 与 Mission Systems 核心业务单元", "管控后中国原产记录与全球贸易结果"],
    nodes: [], evidence: [],
    gaps: ["其他业务单元与子公司别名补查", "管控前自中国进口基线", "集团内部采购与领料记录"],
  },
  {
    entityId: 2,
    finding: "暂未发现替代供应链",
    confidence: "—",
    summary: "发现一条台湾供应商向列名主体交付军用方舱发电机/安装套件的单腿记录，但没有证据证明货物来自中国大陆或经替代主体转入。",
    checks: ["L3Harris Technologies 精确采购商名称", "Aerojet Rocketdyne 核心子公司", "中国原产条件及台湾 Champion Auto 单腿记录"],
    nodes: [], evidence: [],
    gaps: ["Champion Auto 上游零部件原产地", "提单、批号与生产商字段", "中国大陆供应商或中转主体证据"],
  },
  {
    entityId: 3,
    finding: "暂未发现替代供应链",
    confidence: "—",
    summary: "当前口径下未检出英特磊列名主体或集团别名的可用贸易记录。",
    checks: ["Intelligent Epitaxy Technology 精确名称", "IntelliEPI Inc. 集团别名", "全球来源与中国原产两组口径"],
    nodes: [], evidence: [],
    gaps: ["地址、曾用名与报关名称映射", "外延片及关键原料商品词补查", "管控前进口基线"],
  },
  {
    entityId: 4,
    finding: "暂未发现替代供应链",
    confidence: "—",
    summary: "未检出 Clear Align LLC 的贸易记录；公开资料称其制造体系在美国垂直整合，现阶段缺少境外替代进口指向。",
    checks: ["Clear Align LLC 精确名称全球检索", "中国原产条件", "公开制造布局与集团/子公司关系"],
    nodes: [], evidence: [],
    gaps: ["采购订单与供应商名录", "光学材料上游原产地", "关联公司报关别名"],
  },
  {
    entityId: 5,
    finding: "集团承接风险线索",
    confidence: "B级 · 60分",
    summary: "波音防务精确名未检出记录，但其集团母体在管控后持续自中国进口航空材料与部件；集团内部最终流向尚未闭合。",
    checks: ["Boeing Defense, Space & Security 精确名称", "The Boeing Company 集团进口主体", "300条原始结果全页读取与精确去重", "商品、防务关键词与最终用途反证核查"],
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
];
const delay = (index: number) => ({ "--delay": `${Math.min(index * 70, 560)}ms` } as CSSProperties);
const regionStopOne = regionData[0].share;
const regionStopTwo = regionStopOne + regionData[1].share;
const regionStopThree = regionStopTwo + regionData[2].share;
const segmentGap = 0.65;
const donutStyle = {
  background: `conic-gradient(from -90deg, #08c8d5 0 ${regionStopOne - segmentGap}%, transparent ${regionStopOne - segmentGap}% ${regionStopOne}%, #347cff ${regionStopOne}% ${regionStopTwo - segmentGap}%, transparent ${regionStopTwo - segmentGap}% ${regionStopTwo}%, #7b68f6 ${regionStopTwo}% ${regionStopThree - segmentGap}%, transparent ${regionStopThree - segmentGap}% ${regionStopThree}%, #ee5fa8 ${regionStopThree}% ${100 - segmentGap}%, transparent ${100 - segmentGap}% 100%)`,
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
      { view: "entities", label: "管制企业清单", note: "153个官方列名实体" },
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
  const [type, setType] = useState("全部类型");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpenMenu(null);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.entities.filter(
      (item) =>
        (!q || `${item.nameCn} ${item.nameEn} ${item.notice}`.toLowerCase().includes(q)) &&
        (region === "全部地区" || item.region === region) &&
        (year === "全部年份" || item.effectiveDate.startsWith(year)) &&
        (type === "全部类型" || item.entityType === type),
    );
  }, [query, region, year, type]);

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

          <div className="asof"><i /> 数据更新至 2026.08.25</div>
        </div>
      </header>

      {openMenu && <button className="menu-scrim" onClick={() => setOpenMenu(null)} aria-label="关闭导航菜单" />}

      {activeView === "home" ? (
        <HomeDashboard onSelect={selectView} />
      ) : (
        <section className="content shell" id="workspace">
          {activeView === "entities" && (
            <EntityRegistry
              query={query}
              region={region}
              year={year}
              type={type}
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
              setType={setType}
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

function HomeDashboard({ onSelect }: { onSelect: (view: View) => void }) {
  return (
    <>
      <section className="home-hero shell">
        <div className="hero-copy">
          <h1>中国出口管制<br /><em>实体与政策情报台</em></h1>
          <p className="hero-slogan"><span>对象识别</span><i /><span>关系穿透</span></p>
        </div>
      </section>

      <section className="stats-strip shell" aria-label="整体数据统计">
        <StatCard value={String(data.entities.length)} label="官方列名实体" note="Official entries" index="01" />
        <StatCard value={String(companyCount)} label="商业主体" note="Companies" index="02" />
        <StatCard value={String(institutionCount)} label="机构 / 单位" note="Institutions" index="03" />
        <StatCard value={String(data.notices.length)} label="公告批次" note="Official notices" index="04" />
      </section>

      <section className="home-grid shell">
        <CountryPanel />
        <article className="signal-panel">
          <div className="panel-heading"><div><span>LATEST SIGNALS</span><h2>最新政策信号</h2></div><button onClick={() => onSelect("notices")}>全部公告 ↗</button></div>
          <div className="latest-list">
            {notices.slice(0, 3).map((notice, index) => (
              <a href={notice.url} target="_blank" rel="noreferrer" key={notice.notice}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><time>{notice.date}</time><strong>{notice.notice}</strong><small>{notice.region} · 新增 {notice.count} 个实体</small></div>
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

function CountryPanel() {
  return (
    <article className="country-panel">
      <div className="panel-heading"><div><span>GEOGRAPHIC EXPOSURE</span><h2>国家 / 地区分布</h2></div></div>
      <div className="country-visual">
        <div className="donut-shell" aria-hidden="true">
          <div className="donut-halo" />
          <div className="donut-radar" />
          <div className="donut" style={donutStyle} />
          <i className="donut-node dn-one" /><i className="donut-node dn-two" /><i className="donut-node dn-three" /><i className="donut-node dn-four" />
          <div className="donut-core"><small>GEO NODES</small><strong>04</strong><span>区域覆盖</span></div>
        </div>
        <div className="country-legend">
          {regionData.map((item) => (
            <div key={item.name}>
              <i className={item.tone} /><span>{item.name}</span><strong>{item.count}</strong><small>{item.share.toFixed(1)}%</small>
              <em><b className={item.tone} style={{ width: `${item.share}%` }} /></em>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function EntityRegistry(props: {
  query: string; region: string; year: string; type: string; filtered: Entity[]; visible: Entity[];
  page: number; pages: number; currentPage: number; setPage: (value: number | ((page: number) => number)) => void;
  changeFilter: (setter: (value: string) => void, value: string) => void;
  setQuery: (value: string) => void; setRegion: (value: string) => void; setYear: (value: string) => void; setType: (value: string) => void;
}) {
  const { query, region, year, type, filtered, visible, page, pages, currentPage, setPage, changeFilter, setQuery, setRegion, setYear, setType } = props;
  return <div className="module-panel">
    <div className="filters">
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => changeFilter(setQuery, event.target.value)} placeholder="搜索中文名、英文名或公告号" /></label>
      <select aria-label="地区" value={region} onChange={(event) => changeFilter(setRegion, event.target.value)}>{["全部地区", "美国", "日本", "欧盟", "台湾地区"].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="年份" value={year} onChange={(event) => changeFilter(setYear, event.target.value)}>{["全部年份", "2025", "2026"].map((option) => <option key={option}>{option}</option>)}</select>
      <select aria-label="类型" value={type} onChange={(event) => changeFilter(setType, event.target.value)}>{["全部类型", "企业", "机构/单位"].map((option) => <option key={option}>{option}</option>)}</select>
    </div>
    <div className="table-card">
      <div className="table-meta"><span>检索结果 <b>{filtered.length}</b> 条</span><span>官方公告来源已逐条关联</span></div>
      <div className="table-scroll"><table><thead><tr><th>序号</th><th>实体名称</th><th>国家 / 地区</th><th>类型</th><th>生效日</th><th>公告批次</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td className="muted">{String(item.id).padStart(3, "0")}</td><td><a className="entity-name" href={item.sourceUrl} target="_blank" rel="noreferrer"><strong>{item.nameCn}</strong><span>{item.nameEn}</span></a></td><td><span className={`tag ${regionTone[item.region]}`}>{item.region}</span></td><td>{item.entityType}</td><td className="mono">{item.effectiveDate}</td><td>{item.notice}</td><td><a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.notice}`}>↗</a></td></tr>)}</tbody></table></div>
      <div className="pager"><span>第 {currentPage} / {pages} 页</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← 上一页</button><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>下一页 →</button></div></div>
    </div>
  </div>;
}

function NoticeModule() {
  return <div className="module-panel"><div className="notice-grid">{notices.map((notice, index) => <article className={`notice-card reveal ${regionTone[notice.region]}`} style={delay(index)} key={notice.notice}><div className="notice-top"><span className={`tag ${regionTone[notice.region]}`}>{notice.region}</span><time>{notice.date}</time></div><div className="notice-index">{String(data.notices.length - index).padStart(2, "0")}</div><h3>{notice.notice}</h3><p>本批次新增 <strong>{notice.count}</strong> 个管控实体。</p><div className="notice-bottom"><span><b>{notice.count}</b> ENTITIES</span><a href={notice.url} target="_blank" rel="noreferrer">公告原文 ↗</a></div></article>)}</div></div>;
}

function TimelineModule() {
  return <div className="module-panel"><div className="timeline-summary"><div><span>政策跨度</span><b>2025—2026</b></div><i /><p>2025年名单机制密集落地，2026年对象范围扩展至日本和欧盟，并强化对原产中国两用物项境外转移的约束。</p></div><div className="timeline-track"><div className="track-line"><i /></div>{notices.map((notice, index) => <article className={`timeline-event reveal ${regionTone[notice.region]} ${index === 0 ? "latest" : ""}`} style={delay(index)} key={notice.notice}><div className="timeline-date"><b>{notice.date.slice(5).replace("-", ".")}</b><span>{notice.date.slice(0, 4)}</span></div><div className="timeline-node"><i /><em /></div><div className="timeline-card"><div className="timeline-card-top"><span className={`tag ${regionTone[notice.region]}`}>{notice.region}</span><small>+{notice.count} ENTITIES</small>{index === 0 && <b>最新</b>}</div><h3>{notice.notice}</h3><p>{index === data.notices.length - 1 ? "出口管制管控名单进入实体化实施阶段。" : "管控范围持续扩围，名单主体及替代交易路径成为合规核查重点。"}</p><a href={notice.url} target="_blank" rel="noreferrer">查看政策原文 <span>↗</span></a></div></article>)}</div></div>;
}

function ScreeningModule() {
  const [selectedId, setSelectedId] = useState(screeningEntities[0].id);
  const entity = screeningEntities.find((item) => item.id === selectedId) || screeningEntities[0];
  const currentCase = screeningCases.find((item) => item.entityId === entity.id) || screeningCases[0];
  const hasEvidence = currentCase.nodes.length > 0 && currentCase.evidence.length > 0;
  const ledger = [
    ["关系证据", "集团控制、关联公司或代理关系"],
    ["交易证据", "进口商、商品、供应商与运输记录"],
    ["时间证据", "管控前后交易连续性与主体切换"],
  ];

  return <div className="module-panel penetration-workspace">
    <div className="penetration-toolbar">
      <label className="entity-combobox"><span>选择管制企业</span><select aria-label="选择管制企业" value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))}>{screeningEntities.map((item) => <option value={item.id} key={item.id}>{String(item.id).padStart(3, "0")} · {item.nameCn} · {item.nameEn}</option>)}</select></label>
    </div>

    <section className="penetration-case-panel">
        <header className="case-heading">
          <div><span>管制实体 {String(entity.id).padStart(3, "0")}</span><h2>{entity.nameCn}</h2><p>{entity.nameEn}</p></div>
          <div className="case-heading-meta"><strong className={hasEvidence ? "positive" : "pending"}>{currentCase.finding}</strong>{hasEvidence && <b>{currentCase.confidence}</b>}<small>{entity.notice} · {entity.effectiveDate}</small><a href={entity.sourceUrl} target="_blank" rel="noreferrer">官方公告 ↗</a></div>
        </header>

        <div className={`chain-evidence-board ${hasEvidence ? "has-evidence" : "is-empty"}`}>
          <div className="chain-board-head"><strong>替代进口供应链</strong><div><span>{currentCase.nodes.length} 节点</span><span>{Math.max(0, currentCase.nodes.length - 1)} 关系</span><i /></div></div>
          {hasEvidence && <div className="chain-risk-note"><p>{currentCase.summary}</p><span>当前为风险线索，尚未形成最终用途闭环。</span></div>}
          <div className="chain-canvas">
            <div className="chain-scan" aria-hidden="true" />
            {hasEvidence ? <div className="chain-node-row">
              {currentCase.nodes.map((node, index) => <div className="chain-node-wrap" key={`${node.stage}-${node.name}`}>
                <article className={`chain-node ${node.tone}`}><span>{node.stage}</span><strong>{node.name}</strong><small>{node.note}</small></article>
                {index < currentCase.nodes.length - 1 && <div className={`chain-link ${node.connection === "pending" ? "pending" : "verified"}`}><i /><b>›</b><small>{node.connection === "pending" ? "流向待核" : "贸易记录"}</small></div>}
              </div>)}
            </div> : <div className="chain-empty-state">
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
            {hasEvidence ? <div>{currentCase.evidence.map((item) => <section key={`${item.category}-${item.title}`}><i /><div><span>{item.category}</span><strong>{item.title}</strong><p>{item.detail}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.source || "查看来源"} ↗</a>}</div></section>)}</div> : <div className="ledger-empty">{ledger.map(([title, note]) => <section key={title}><i /><div><strong>{title}</strong><p>{note}</p></div><span>待补证</span></section>)}</div>}
          </article>
          <article className="verification-gaps">
            <header><strong>尚待核实</strong><b>{currentCase.gaps.length}</b></header>
            <p>{hasEvidence ? "当前链路仅用于风险排序；在内部流向闭合前，不认定为已证实替代进口。" : "“暂未发现”仅表示当前证据库未形成可报告链路，不等同于不存在相关交易。"}</p>
            <ol>{currentCase.gaps.map((gap, index) => <li key={gap}><span>{String(index + 1).padStart(2, "0")}</span>{gap}</li>)}</ol>
          </article>
        </div>
      </section>
  </div>;
}
