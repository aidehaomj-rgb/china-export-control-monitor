import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "战略贸易管制监测台｜出口管制实体情报库", description: "聚合中国出口管制管控名单、官方公告与政策时间轴的专题情报库。" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html>; }
