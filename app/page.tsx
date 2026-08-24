"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import data from "../public/data/control-entities.json";

type Tab = "entities" | "notices" | "timeline";
type Entity = (typeof data.entities)[number];
const regionTone: Record<string, string> = { 美国: "red", 日本: "amber", 欧盟: "blue", 台湾地区: "violet" };
const regionTotal = data.entities.reduce<Record<string, number>>((acc, item) => { acc[item.region] = (acc[item.region] || 0) + 1; return acc; }, {});
const notices = [...data.notices].reverse();
const delay = (index: number) => ({ "--delay": `${Math.min(index * 70, 560)}ms` } as CSSProperties);

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("entities");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部地区");
  const [year, setYear] = useState("全部年份");
  const [type, setType] = useState("全部类型");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return data.entities.filter((item) => (!q || `${item.nameCn} ${item.nameEn} ${item.notice}`.toLowerCase().includes(q)) && (region === "全部地区" || item.region === region) && (year === "全部年份" || item.effectiveDate.startsWith(year)) && (type === "全部类型" || item.entityType === type)); }, [query, region, year, type]);
  const pageSize = 15, pages = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const changeFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };

  return <main className="site-frame">
    <div className="ambient-grid" aria-hidden="true" /><div className="ambient-glow" aria-hidden="true" />
    <header className="topbar"><div className="brand"><div className="brand-mark">控</div><div><strong>战略贸易管制监测台</strong><span>STRATEGIC TRADE CONTROL MONITOR</span></div></div><div className="asof"><i /> 数据更新至 2026.08.24</div></header>
    <section className="hero shell">
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> EXPORT CONTROL INTELLIGENCE <b>中国政策专题</b></div><h1>出口管制<br /><em>实体情报库</em></h1><p>将分散的管控名单与政策公告转化为可检索、可追踪、可继续穿透的实体情报底图。</p><div className="hero-actions"><button onClick={() => setActiveTab("entities")}>浏览实体清单 <span>→</span></button><button onClick={() => setActiveTab("timeline")}>查看政策演进</button></div></div>
    </section>
    <section className="metrics shell" aria-label="数据概览"><Metric value="139" label="管控企业" note="商业主体" /><Metric value="14" label="机构 / 单位" note="研究与教育机构" /><Metric value="4" label="覆盖区域" note="跨境管控对象" /><article className="distribution"><header><span>地区分布</span><b>REGIONAL EXPOSURE</b></header>{Object.entries(regionTotal).map(([name,count])=><div className="bar-row" key={name}><label>{name}<b>{count}</b></label><i><em className={regionTone[name]} style={{width:`${count/84*100}%`}} /></i></div>)}</article></section>
    <nav className="tabs shell" aria-label="主要模块">{([["entities","管制企业清单","153"],["notices","公告库","11"],["timeline","政策时间轴","LIVE"]] as const).map(([id,label,count])=><button key={id} className={activeTab===id?"active":""} onClick={()=>setActiveTab(id)}><span>{label}</span><b>{count}</b></button>)}</nav>
    <section className="content shell">
      {activeTab === "entities" && <div className="module-panel"><SectionHead kicker="ENTITY REGISTRY" title="管制企业清单" note="官方名称直接入库 · 暂未按集团控制关系合并" /><div className="filters"><label className="search"><span>⌕</span><input value={query} onChange={e=>changeFilter(setQuery,e.target.value)} placeholder="搜索中文名、英文名或公告号" /></label>{[[region,setRegion,["全部地区","美国","日本","欧盟","台湾地区"]],[year,setYear,["全部年份","2025","2026"]],[type,setType,["全部类型","企业","机构/单位"]]].map(([value,setter,options],i)=><select aria-label={["地区","年份","类型"][i]} key={i} value={value as string} onChange={e=>changeFilter(setter as (v:string)=>void,e.target.value)}>{(options as string[]).map(o=><option key={o}>{o}</option>)}</select>)}</div><div className="table-card"><div className="table-meta"><span>检索结果 <b>{filtered.length}</b> 条</span><span>官方公告来源已逐条关联</span></div><div className="table-scroll"><table><thead><tr><th>序号</th><th>实体名称</th><th>国家 / 地区</th><th>类型</th><th>生效日</th><th>公告批次</th><th /></tr></thead><tbody>{visible.map((item:Entity)=><tr key={item.id}><td className="muted">{String(item.id).padStart(3,"0")}</td><td><a className="entity-name" href={item.sourceUrl} target="_blank" rel="noreferrer"><strong>{item.nameCn}</strong><span>{item.nameEn}</span></a></td><td><span className={`tag ${regionTone[item.region]}`}>{item.region}</span></td><td>{item.entityType}</td><td className="mono">{item.effectiveDate}</td><td>{item.notice}</td><td><a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.notice}`}>↗</a></td></tr>)}</tbody></table></div><div className="pager"><span>第 {currentPage} / {pages} 页</span><div><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← 上一页</button><button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>下一页 →</button></div></div></div></div>}
      {activeTab === "notices" && <div className="module-panel"><SectionHead kicker="OFFICIAL NOTICES" title="公告库" note="11批公告 · 商务部官方原文" /><div className="notice-grid">{notices.map((notice,index)=><article className="notice-card reveal" style={delay(index)} key={notice.notice}><div className="notice-top"><span className={`tag ${regionTone[notice.region]}`}>{notice.region}</span><time>{notice.date}</time></div><div className="notice-index">{String(data.notices.length-index).padStart(2,"0")}</div><h3>{notice.notice}</h3><p>本批次新增 <strong>{notice.count}</strong> 个管控实体。</p><div className="notice-bottom"><span><b>{notice.count}</b> ENTITIES</span><a href={notice.url} target="_blank" rel="noreferrer">公告原文 ↗</a></div></article>)}</div></div>}
      {activeTab === "timeline" && <div className="module-panel"><SectionHead kicker="POLICY SIGNAL TRACK" title="政策时间轴" note="制度落地 · 对象扩围 · 域外约束" /><div className="timeline-summary"><div><span>累计列入</span><b>153</b></div><i /><p>2025年名单机制密集落地，2026年对象范围扩展至日本和欧盟，并强化对原产中国两用物项境外转移的约束。</p></div><div className="timeline-track"><div className="track-line"><i /></div>{notices.map((notice,index)=><article className={`timeline-event reveal ${index===0?"latest":""}`} style={delay(index)} key={notice.notice}><div className="timeline-date"><b>{notice.date.slice(5).replace("-",".")}</b><span>{notice.date.slice(0,4)}</span></div><div className={`timeline-node ${regionTone[notice.region]}`}><i /><em /></div><div className="timeline-card"><div className="timeline-card-top"><span className={`tag ${regionTone[notice.region]}`}>{notice.region}</span><small>+{notice.count} ENTITIES</small>{index===0&&<b>最新</b>}</div><h3>{notice.notice}</h3><p>{index===data.notices.length-1?"出口管制管控名单进入实体化实施阶段。":"管控范围持续扩围，名单主体及替代交易路径成为合规核查重点。"}</p><a href={notice.url} target="_blank" rel="noreferrer">查看政策原文 <span>↗</span></a></div></article>)}</div></div>}
    </section>
    <footer><div className="shell"><span>战略贸易管制监测台</span><p>资料来源：中华人民共和国商务部 · 仅作政策与贸易情报研究，不构成法律意见</p></div></footer>
  </main>;
}

function Metric({value,label,note}:{value:string;label:string;note:string}) { return <article className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function SectionHead({kicker,title,note}:{kicker:string;title:string;note:string}) { return <div className="section-head"><div><span>{kicker}</span><h2>{title}</h2></div><p>{note}</p></div>; }
