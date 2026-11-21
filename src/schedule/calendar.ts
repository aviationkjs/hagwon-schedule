import type { EventInput } from "@fullcalendar/core";
import type { ClassInfo, Hue, Session } from "../data/types";

/** Astryx 분류용 색 10가지. 색은 '어느 반인지'만 나타내고 상태를 뜻하지 않는다. */
export const HUES: Hue[] = ["blue", "green", "orange", "purple", "teal", "pink", "cyan", "yellow", "red", "gray"];

export const HUE_LABEL: Record<Hue, string> = {
  blue: "파랑", green: "초록", orange: "주황", purple: "보라", teal: "청록",
  pink: "분홍", cyan: "하늘", yellow: "노랑", red: "빨강", gray: "회색",
};

/** 반 색: 고른 색이 있으면 그 색, 없으면 반 id로 정해지는 색 (회색은 '알 수 없음'용으로 남긴다). */
export function classHue(cls: ClassInfo): Hue {
  if (cls.color) return cls.color;
  let h = 0;
  for (const ch of cls.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[h % (HUES.length - 1)];
}

export type SessionEventProps = { room: string; teacherName: string; status: Session["status"] };

export function toEvents(sessions: Session[], classes: ClassInfo[]): EventInput[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  return sessions.map((s) => {
    const cls = byId.get(s.classId);
    const props: SessionEventProps = { room: s.room, teacherName: cls?.teacherName ?? "", status: s.status };
    return {
      id: s.id,
      title: cls?.name ?? "알 수 없는 반",
      start: s.startAt,
      end: s.endAt,
      classNames: [`hue-${cls ? classHue(cls) : "gray"}`, ...(s.status === "변경됨" ? ["is-changed"] : [])],
      extendedProps: props,
    };
  });
}
