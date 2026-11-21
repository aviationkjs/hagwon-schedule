import { useRef, useState, type TouchEvent } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import type { DatesSetArg, EventContentArg, EventInput } from "@fullcalendar/core";
import type { SessionEventProps } from "./calendar";

export type CalendarViewName = "listWeek" | "timeGridThreeDay" | "timeGridWeek" | "dayGridMonth";

export const VIEW_LABEL: Record<CalendarViewName, string> = {
  listWeek: "목록",
  timeGridThreeDay: "3일",
  timeGridWeek: "주",
  dayGridMonth: "월",
};

const VIEW_KEY = "schedule-view";

/** Google Calendar처럼: 휴대폰은 목록, 넓은 화면은 주. 마지막으로 고른 보기를 기억한다. */
function initialView(): CalendarViewName {
  try {
    const saved = localStorage.getItem(VIEW_KEY) as CalendarViewName | null;
    if (saved && saved in VIEW_LABEL) return saved;
  } catch {
    /* 저장소를 못 쓰면 기본값 */
  }
  return typeof window !== "undefined" && window.innerWidth < 768 ? "listWeek" : "timeGridWeek";
}

type Props = {
  events: EventInput[];
  onRangeChange: (start: Date, end: Date) => void;
  onSelectEvent: (id: string) => void;
  /** 관리자만: 빈 시간을 누르거나 끌어서 수업 추가 */
  onCreate?: (start: Date, end: Date) => void;
};

export function CalendarView({ events, onRangeChange, onSelectEvent, onCreate }: Props) {
  const ref = useRef<FullCalendar>(null);
  const [view, setView] = useState<CalendarViewName>(initialView);
  const [title, setTitle] = useState("");
  const touchX = useRef<number | null>(null);

  const api = () => ref.current?.getApi();

  function changeView(v: CalendarViewName) {
    setView(v);
    api()?.changeView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* 무시 */
    }
  }

  function onDatesSet(arg: DatesSetArg) {
    setTitle(arg.view.title);
    onRangeChange(arg.start, arg.end);
  }

  // 휴대폰: 좌우로 밀어 이전·다음 기간
  const onTouchStart = (e: TouchEvent) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 60) (dx < 0 ? api()?.next() : api()?.prev());
  };

  return (
    <div className="calendar">
      <div className="cal-toolbar">
        <div className="row gap">
          <button className="btn" onClick={() => api()?.today()}>
            오늘
          </button>
          <button className="btn icon" aria-label="이전" onClick={() => api()?.prev()}>
            ‹
          </button>
          <button className="btn icon" aria-label="다음" onClick={() => api()?.next()}>
            ›
          </button>
          <strong className="cal-title">{title}</strong>
        </div>
        <div className="segmented" role="tablist" aria-label="보기">
          {(Object.keys(VIEW_LABEL) as CalendarViewName[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? "active" : ""} onClick={() => changeView(v)}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={koLocale}
          initialView={view}
          views={{ timeGridThreeDay: { type: "timeGrid", duration: { days: 3 }, dateIncrement: { days: 1 } } }}
          headerToolbar={false}
          firstDay={1}
          height="auto"
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          scrollTime="13:00:00"
          slotDuration="00:30:00"
          nowIndicator
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayMaxEvents={3}
          eventDisplay="block"
          noEventsText="이 기간에는 수업이 없습니다."
          events={events}
          datesSet={onDatesSet}
          eventClick={(info) => onSelectEvent(info.event.id)}
          eventContent={renderEvent}
          selectable={Boolean(onCreate)}
          selectMirror
          selectLongPressDelay={300}
          select={(info) => {
            onCreate?.(info.start, info.end);
            api()?.unselect();
          }}
          dateClick={(info) => {
            // 월 보기에서 날짜를 누르면 그날 16시 수업으로 시작
            if (!onCreate || info.view.type !== "dayGridMonth") return;
            const start = new Date(info.date);
            start.setHours(16, 0, 0, 0);
            onCreate(start, new Date(start.getTime() + 90 * 60 * 1000));
          }}
        />
      </div>
    </div>
  );
}

function renderEvent(arg: EventContentArg) {
  const p = arg.event.extendedProps as SessionEventProps;
  const isList = arg.view.type.startsWith("list"); // 목록 보기는 시간 칸이 따로 있다
  return (
    <div className="ev">
      {!isList && <span className="ev-time">{arg.timeText}</span>}
      <span className="ev-title">
        {arg.event.title}
        {p.status === "변경됨" && <span className="ev-badge">변경됨</span>}
      </span>
      {p.room && <span className="ev-meta">{p.room}</span>}
    </div>
  );
}
