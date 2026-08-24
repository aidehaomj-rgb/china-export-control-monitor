"use client";

import { useMemo, useState } from "react";
import data from "../public/data/control-entities.json";

type Tab = "entities" | "notices" | "timeline";
type Entity = (typeof data.entities)[number];
const regionTone: Record<string, string> = { 美国: "red", 日本: "amber", 欧盟: "blue", 台湾地区: "violet" };
const regionTotal = data.entities.reduce<Record<string, number>>((acc, item) => { acc[item.region] = (acc[item.region] || 0) + 1; return acc; }, {});
const ExternalArrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("entities");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部地区");
  const [year, setYear] = useState("全部年份");
  const [type, setType] = useState("全部类型");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.entities.filter((item) => (!q || `${item.nameCn} ${item.nameEn} ${item.notice}`.toLowerCase().includes(q)) && (region === "全部地区" || item.region === region) && (year === "全部年份" || item.effectiveDate.startsWith(year)) && (type === "全部类型" || item.entityType === type));
  }, [query, region, year, type]);
  const pageSize = 15, pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const changeFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };

  return <main>
    <header className="topbar"><div className="brand"><div className="brand-mark">控</div><div><strong>战略贸易管制监测台</strong><span>STRATEGIC TRADE CONTROL MONITOR</span></div></div><div className="asof"><i /> 数据更新至 2026.08.24</div></header>
    <section className="hero shell">
      <div className="eyebrow"><span>EXPORT CONTROL WATCH</span><span>中国政策专题</span></div>
      <div className="hero-grid"><div><h1>出口管制<br /><em>实体情报库</em></h1><p>聚合商务部出口管制管控名单、原始公告与政策演进，形成可检索、可追溯、可继续开展贸易穿透的实体底图。</p></div><div className="hero-metric"><div className="metric-number">153</div><div><b>名义实体条目</b><span>11 批正式公告 · 2025—2026</span></div></div></div>
      <div className="kpi-grid"><article><span>管控企业</span><strong>139</strong><small>企业法人及商业主体</small></article><article><span>机构 / 单位</span><strong>14</strong><small>大学、研究所与实验室</small></article><article><span>覆盖区域</span><strong>4</strong><small>美国、日本、欧盟、台湾地区</small></article><article className="distribution"><span>地区分布</span><div>{Object.entries(regionTotal).map(([name,count])=><div key={name}><label>{name}<b>{count}</b></label><i><em className={regionTone[name]} style={{width:`${count/84*100}%`}} /></i></div>)}</div></article></div>
    </section>
    <nav className="tabs shell" aria-label="主要模块">{([["entities","管制企业清单","153"],["notices","公告库","11"],["timeline","政策时间轴","2025—2026"]] as const).map(([id,label,count])=><button key={id} className={activeTab===id?"active":""} onClick={()=>setActiveTab(id)}><span>{label}</span><b>{count}</b></button>)}</nav>
    <section className="content shell">
      {activeTab === "entities" && <><SectionHead kicker="ENTITY REGISTRY" title="管制企业清单" note="官方名称直接入库，暂未按集团控制关系合并" /><div className="filters"><label className="search"><span>⌕</span><input value={query} onChange={e=>changeFilter(setQuery,e.target.value)} placeholder="搜索中文名、英文名或公告号" /></label>{[[region,setRegion,["全部地区","美国","日本","欧盟","台湾地区"]],[year,setYear,["全部年份","2025","2026"]],[type,setType,["全部类型","企业","机构/单位"]]].map(([value,setter,options],i)=><select aria-label={["地区","年份","类型"][i]} key={i} value={value as string} onChange={e=>changeFilter(setter as (v:string)=>void,e.target.value)}>{(options as string[]).map(o=><option key={o}>{o}</option>)}</select>)}</div>
        <div className="table-card"><div className="table-meta"><span>检索结果 <b>{filtered.length}</b> 条</span><span>点击企业名称查看官方公告来源</span></div><div className="table-scroll"><table><thead><tr><th>序号</th><th>实体名称</th><th>国家 / 地区</th><th>实体类型</th><th>生效日</th><th>公告批次</th><th>来源</th></tr></thead><tbody>{visible.map((item:Entity)=><tr key={item.id}><td className="muted">{String(item.id).padStart(3,"0")}</td><td><a className="entity-name" href={item.sourceUrl} target="_blank" rel="noreferrer"><strong>{item.nameCn}</strong><span>{item.nameEn}</span></a></td><td><span className={`tag ${regionTone[item.region]}`}>{item.region}</span></td><td>{item.entityType}</td><td className="mono">{item.effectiveDate}</td><td>{item.notice}</td><td><a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.notice}`}><ExternalArrow /></a></td></tr>)}</tbody></table></div><div className="pager"><span>第 {currentPage} / {pages} 页</span><div><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← 上一页</button><button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>下一页 →</button></div></div></div></>}
      {activeTab === "notices" && <><SectionHead kicker="OFFICIAL NOTICES" title="公告库" note="11批公告逐条关联至商务部官方原文" /><div className="notice-grid">{[...data.notices].reverse().map((notice,index)=><article className="notice-card" key={notice.notice}><div className="notice-top"><span className={`tag ${regionTone[notice.region]}`}>{notice.region}</span><time>{notice.date}</time></div><div className="notice-index">{String(data.notices.length-index).padStart(2,"0")}</div><h3>{notice.notice}</h3><p>将该批次 <strong>{notice.count}</strong> 家（个）实体列入出口管制管控名单。</p><div className="notice-bottom"><span><b>{notice.count}</b> 个实体</span><a href={notice.url} target="_blank" rel="noreferrer">查看公告原文 <ExternalArrow /></a></div></article>)}</div></>}
      {activeTab === "timeline" && <><SectionHead kicker="POLICY TIMELINE" title="政策时间轴" note="从制度落地到对象扩展的连续观察" /><div className="timeline-intro"><strong>政策演进判断</strong><p>名单机制由2025年初集中针对美国军工与技术实体，逐步扩展至台湾地区、日本及欧盟；2026年公告开始普遍明确禁止境外组织和个人转移或提供原产中国的两用物项，域外转移约束进一步清晰。</p></div><div className="timeline">{[...data.notices].reverse().map((notice,index)=><article key={notice.notice}><div className="timeline-date"><b>{notice.date.slice(5).replace("-",".")}</b><span>{notice.date.slice(0,4)}</span></div><div className={`timeline-node ${regionTone[notice.region]}`}><i /></div><div className="timeline-card"><div><span className={`tag ${regionTone[notice.region]}`}>{notice.region}</span><small>新增 {notice.count} 个实体</small></div><h3>{notice.notice}</h3><p>{index===data.notices.length-1?"中国两用物项出口管制管控名单进入实体化实施阶段。":"管控对象持续扩围，名单主体及其替代交易路径成为合规核查重点。"}</p><a href={notice.url} target="_blank" rel="noreferrer">官方原文 <ExternalArrow /></a></div></article>)}</div></>}
    </section>
    <footer><div className="shell"><span>战略贸易管制监测台</span><p>资料来源：中华人民共和国商务部 · 本站仅作政策与贸易情报研究，不构成法律意见</p></div></footer>
  </main>;
}

function SectionHead({kicker,title,note}:{kicker:string;title:string;note:string}) { return <div className="section-head"><div><span>{kicker}</span><h2>{title}</h2></div><p>{note}</p></div>; }
