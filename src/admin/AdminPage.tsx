import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClassEditor } from "./ClassEditor";
import { GroupEditor } from "./GroupEditor";
import { MemberEditor } from "./MemberEditor";
import { StudentEditor } from "./StudentEditor";

const TABS = ["그룹", "반·수업", "학생", "구성원"] as const;
type Tab = (typeof TABS)[number];
// #/admin?tab=class 처럼 바로 열 수 있게
const TAB_PARAM: Record<string, Tab> = { group: "그룹", class: "반·수업", student: "학생", member: "구성원" };

export function AdminPage() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(TAB_PARAM[params.get("tab") ?? ""] ?? "그룹");
  return (
    <div className="page">
      <h2>편성 관리</h2>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === "그룹" && <GroupEditor />}
      {tab === "반·수업" && <ClassEditor />}
      {tab === "학생" && <StudentEditor />}
      {tab === "구성원" && <MemberEditor />}
    </div>
  );
}
