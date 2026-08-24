"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import data from "../public/data/control-entities.json";

type View = "home" | "entities" | "notices" | "timeline" | "screening" | "method";
type MenuId = "entities" | "policy" | "research";
type Entity = (typeof data.entities)[number];

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
    views: ["screening", "method"],
    items: [
      { view: "screening", label: "替代进口排查", note: "管控后交易延续线索" },
      { view: "method", label: "关联穿透方法", note: "集团、主体与贸易路径" },
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
          <button className="brand" onClick={() => selectView("home")} aria-label="返回首页">
            <span className="brand-mark">控</span>
            <span className="brand-copy">
              <strong>战略贸易管制监测台</strong>
              <small>STRATEGIC TRADE CONTROL</small>
            </span>
          </button>

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

          <div className="asof"><i /> 数据更新至 2026.08.24</div>
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
          {activeView === "screening" && <ScreeningModule onSelect={selectView} />}
          {activeView === "method" && <MethodModule onSelect={selectView} />}
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

function ScreeningModule({ onSelect }: { onSelect: (view: View) => void }) {
  const stages = [
    ["01", "列名对象锚定", "统一中英文名称、曾用名、地址及集团归属。"],
    ["02", "管控前基线", "确认被管控前自中国进口的商品、供应商与频次。"],
    ["03", "管控后替代主体", "排查同集团关联公司、代理商或新设贸易主体。"],
    ["04", "连续交易验证", "用时间、商品、港口和供应商重合度形成证据链。"],
  ];
  return <div className="module-panel screening-layout"><article className="screening-intro"><span>RESEARCH PIPELINE</span><h2>从名单命中走向替代进口识别</h2><p>本模块先展示排查框架。后续接入贸易数据后，可按列名企业逐一判断是否通过其他主体延续自中国进口。</p><button onClick={() => onSelect("method")}>查看完整穿透方法 <span>↗</span></button></article><div className="screening-steps">{stages.map(([index, title, note], position) => <article className="reveal" style={delay(position)} key={index}><span>{index}</span><div><h3>{title}</h3><p>{note}</p></div><i>{position < stages.length - 1 ? "↓" : "✓"}</i></article>)}</div><div className="screening-status"><div><i /><span>当前状态</span><strong>框架已建立</strong></div><p>暂无未经核验的替代进口结论在公开页面展示。研究结果将以“线索—证据—置信度”三层结构呈现。</p></div></div>;
}

function MethodModule({ onSelect }: { onSelect: (view: View) => void }) {
  const layers = [
    { id: "L1", title: "官方名单层", note: "以商务部公告中的法定名称为起点，建立实体唯一标识。" },
    { id: "L2", title: "集团控制层", note: "识别母公司、子公司、品牌、业务部门及实际控制关系。" },
    { id: "L3", title: "贸易主体层", note: "关联进口商、收货人、通知方、代理商与同址企业。" },
    { id: "L4", title: "交易延续层", note: "比较管控前后商品、供应商、港口、频次和数量变化。" },
    { id: "L5", title: "证据评估层", note: "区分直接证据、强线索与待核线索，保留来源和时间戳。" },
  ];
  return <div className="module-panel method-layout"><div className="method-rail">{layers.map((layer, index) => <article className="reveal" style={delay(index)} key={layer.id}><span>{layer.id}</span><i /><div><h3>{layer.title}</h3><p>{layer.note}</p></div></article>)}</div><aside className="method-aside"><span>TDK-STYLE LOGIC</span><h2>以集团逻辑为骨架，避免只看列名主体</h2><p>核心不是把名称相近的公司直接判定为替代路径，而是让控制关系与连续交易特征相互印证。</p><div><small>最小证据组合</small><strong>关系证据 × 交易证据 × 时间证据</strong></div><button onClick={() => onSelect("screening")}>进入替代进口排查 <span>↗</span></button></aside></div>;
}
