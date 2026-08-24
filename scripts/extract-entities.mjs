import fs from "node:fs/promises";

const sourcePath = "../.codex_tmp_control_list/build_control_list.mjs";
const source = await fs.readFile(sourcePath, "utf8");
const match = source.match(/const batches = (\[[\s\S]*?\n\];)\n\nconst institutionWords/);
if (!match) throw new Error("Could not locate batches in source workbook builder");
const batches = Function(`return ${match[1].slice(0, -1)}`)();
const institutionWords = /研究所|大学|研究院|实验室|联盟|Institute|University|Laborator|Academy|Agency|Coalition/i;
let id = 1;
const entities = batches.flatMap((batch) => batch.entities.map(([cn, en], index) => ({
  id: id++,
  notice: batch.notice,
  noticeOrder: index + 1,
  effectiveDate: batch.date,
  region: batch.region,
  nameCn: cn,
  nameEn: en,
  entityType: institutionWords.test(`${cn} ${en}`) ? "机构/单位" : "企业",
  sourceUrl: batch.url,
})));
await fs.mkdir("public/data", { recursive: true });
await fs.writeFile("public/data/control-entities.json", JSON.stringify({ generatedAt: "2026-08-24", entities, notices: batches.map(({ entities: rows, ...rest }) => ({ ...rest, count: rows.length })) }, null, 2));
console.log(`generated ${entities.length} entities and ${batches.length} notices`);
