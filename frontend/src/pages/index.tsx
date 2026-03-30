import { useContext, useState } from "react";
import AuthContext from "../context/AuthProvider";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentType = "Meeting" | "Assessment" | "Follow-up" | "Workshop" | "Crisis" | "Home Visit";

interface CalendarEvent {
  id: string;
  clientName: string;
  startTime: string; // "HH:mm"
  endTime: string;
  date: string;      // "YYYY-MM-DD"
  type: AppointmentType;
  location: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_COLORS: Record<AppointmentType, { bg: string; border: string; text: string }> = {
  "Meeting":    { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  "Assessment": { bg: "#ede9fe", border: "#c4b5fd", text: "#5b21b6" },
  "Follow-up":  { bg: "#dcfce7", border: "#86efac", text: "#15803d" },
  "Workshop":   { bg: "#ffedd5", border: "#fdba74", text: "#c2410c" },
  "Crisis":     { bg: "#fee2e2", border: "#fca5a5", text: "#b91c1c" },
  "Home Visit": { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
};

const LEGEND_DOTS: Record<AppointmentType, string> = {
  "Meeting":    "#3b82f6",
  "Assessment": "#8b5cf6",
  "Follow-up":  "#22c55e",
  "Workshop":   "#f97316",
  "Crisis":     "#ef4444",
  "Home Visit": "#ec4899",
};

const APPOINTMENT_TYPES = Object.keys(APPOINTMENT_COLORS) as AppointmentType[];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM – 6 PM
const HOUR_HEIGHT = 64;

// ─── Event Modal ──────────────────────────────────────────────────────────────

interface ModalState {
  open: boolean;
  prefill: Partial<CalendarEvent> | null;
}

const EventModal = ({
  prefill,
  onSave,
  onDelete,
  onClose,
}: {
  prefill: Partial<CalendarEvent> | null;
  onSave: (e: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}) => {
  const isNew = !prefill?.id;
  const [form, setForm] = useState<Partial<CalendarEvent>>({
    clientName: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "Meeting",
    location: "",
    ...prefill,
  });

  const field = (k: keyof CalendarEvent) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.clientName?.trim() || !form.date) return;
    onSave({
      id: form.id ?? Date.now().toString(),
      clientName: form.clientName.trim(),
      startTime: form.startTime!,
      endTime: form.endTime!,
      date: form.date,
      type: form.type as AppointmentType,
      location: form.location?.trim() ?? "",
    });
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb",
    borderRadius: "6px", fontSize: "14px", color: "#111827",
    background: "#fff", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 600,
    color: "#374151", marginBottom: "4px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "12px", padding: "28px", width: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: 700, color: "#111827" }}>
          {isNew ? "Add Appointment" : "Edit Appointment"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={lbl}>Client Name *</label>
            <input style={inp} value={form.clientName} onChange={field("clientName")} placeholder="e.g. Sarah Johnson" />
          </div>
          <div>
            <label style={lbl}>Date *</label>
            <input style={inp} type="date" value={form.date} onChange={field("date")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={lbl}>Start Time</label>
              <input style={inp} type="time" value={form.startTime} onChange={field("startTime")} />
            </div>
            <div>
              <label style={lbl}>End Time</label>
              <input style={inp} type="time" value={form.endTime} onChange={field("endTime")} />
            </div>
          </div>
          <div>
            <label style={lbl}>Appointment Type</label>
            <select style={inp} value={form.type} onChange={field("type")}>
              {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Location</label>
            <input style={inp} value={form.location} onChange={field("location")} placeholder="e.g. Main Office" />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={handleSave} style={{
            flex: 1, padding: "10px", background: "linear-gradient(135deg, #d63b6e, #c0254e)",
            color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
            {isNew ? "Add Appointment" : "Save Changes"}
          </button>
          {!isNew && onDelete && (
            <button onClick={() => onDelete(prefill!.id!)} style={{
              padding: "10px 16px", background: "#fee2e2", color: "#b91c1c",
              border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>
              Delete
            </button>
          )}
          <button onClick={onClose} style={{
            padding: "10px 16px", background: "#f3f4f6", color: "#374151",
            border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MiniCalendar = ({
  selectedDate,
  onSelectDate,
  onWeekChange,
}: {
  selectedDate: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  onWeekChange: (weekStart: Dayjs) => void;
}) => {
  const [viewMonth, setViewMonth] = useState(selectedDate.startOf("month"));
  const startOfCal = viewMonth.startOf("month").startOf("isoWeek");
  const days = Array.from({ length: 42 }, (_, i) => startOfCal.add(i, "day"));
  const today = dayjs();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>
          {viewMonth.format("MMMM YYYY")}
        </span>
        <div style={{ display: "flex", gap: "2px" }}>
          {(["‹", "›"] as const).map((ch, i) => (
            <button key={ch} onClick={() => setViewMonth(m => m.add(i === 0 ? -1 : 1, "month"))}
              style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#6b7280", padding: "2px 6px" }}>
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "4px" }}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <span key={d} style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af" }}>{d}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {days.map(day => {
          const isToday    = day.isSame(today, "day");
          const isSelected = day.isSame(selectedDate, "day");
          const inMonth    = day.isSame(viewMonth, "month");
          return (
            <button key={day.toString()} onClick={() => {
              onSelectDate(day);
              onWeekChange(day.startOf("isoWeek"));
            }} style={{
              background: isSelected ? "#d63b6e" : isToday ? "#fce7f3" : "transparent",
              color: isSelected ? "#fff" : isToday ? "#d63b6e" : inMonth ? "#111827" : "#d1d5db",
              border: "none", borderRadius: "50%", width: "28px", height: "28px",
              fontSize: "12px", cursor: "pointer", fontWeight: isToday ? 700 : 400,
              margin: "1px auto", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {day.date()}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "24px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>Appointment Types</p>
        {(Object.entries(LEGEND_DOTS) as [AppointmentType, string][]).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#374151" }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Week Grid ────────────────────────────────────────────────────────────────

const WeekGrid = ({
  weekStart,
  events,
  onSlotClick,
  onEventClick,
}: {
  weekStart: Dayjs;
  events: CalendarEvent[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (e: CalendarEvent) => void;
}) => {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));
  const today = dayjs();

  const eventsOnDay = (day: Dayjs) => events.filter(e => dayjs(e.date).isSame(day, "day"));

  const timeToTop = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return (h - 8) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
  };
  const eventHeight = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT, 32);
  };

  const formatHour = (h: number) =>
    h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px", flexShrink: 0 }}>
        <div />
        {days.map(day => {
          const isToday = day.isSame(today, "day");
          return (
            <div key={day.toString()} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {day.format("ddd")}
              </div>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: isToday ? "#d63b6e" : "transparent",
                color: isToday ? "#fff" : "#111827",
                fontWeight: isToday ? 700 : 600, fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "4px auto 0",
              }}>
                {day.date()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", position: "relative" }}>
          {/* Hour labels */}
          <div>
            {HOURS.map(h => (
              <div key={h} style={{ height: `${HOUR_HEIGHT}px`, paddingRight: "8px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "-7px", whiteSpace: "nowrap" }}>
                  {formatHour(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => (
            <div key={day.toString()} style={{ position: "relative", borderLeft: "1px solid #f3f4f6" }}>
              {HOURS.map(h => (
                <div
                  key={h}
                  onClick={() => onSlotClick(day.format("YYYY-MM-DD"), `${String(h).padStart(2, "0")}:00`)}
                  style={{ height: `${HOUR_HEIGHT}px`, borderTop: "1px solid #f3f4f6", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fdf2f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                />
              ))}

              {eventsOnDay(day).map(evt => {
                const c = APPOINTMENT_COLORS[evt.type];
                return (
                  <div
                    key={evt.id}
                    onClick={e => { e.stopPropagation(); onEventClick(evt); }}
                    style={{
                      position: "absolute",
                      top: `${timeToTop(evt.startTime)}px`,
                      left: "2px", right: "2px",
                      height: `${eventHeight(evt.startTime, evt.endTime)}px`,
                      background: c.bg, border: `1px solid ${c.border}`,
                      borderRadius: "6px", padding: "4px 6px",
                      cursor: "pointer", overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
                      {evt.clientName}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: "10px", color: c.text, opacity: 0.85 }}>
                      {evt.startTime} • {evt.type}
                    </p>
                    {evt.location && (
                      <p style={{ margin: "1px 0 0", fontSize: "10px", color: c.text, opacity: 0.7 }}>
                        📍 {evt.location}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Right Panel ──────────────────────────────────────────────────────────────

const EventDetailPanel = ({
  event,
  onEdit,
}: {
  event: CalendarEvent | null;
  onEdit: () => void;
}) => {
  const now = dayjs();

  return (
    <div style={{ padding: "24px" }}>
      <p style={{ margin: "0 0 24px", fontWeight: 700, fontSize: "18px", color: "#111827" }}>
        {now.format("h:mm A")}
      </p>

      {!event ? (
        <div style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center", marginTop: "40px" }}>
          <p style={{ margin: 0, fontSize: "32px" }}>📅</p>
          <p style={{ margin: "12px 0 0" }}>Click a time slot to add an appointment, or click an existing event to view details.</p>
        </div>
      ) : (
        <>
          <h3 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            {event.clientName}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>🕐</span>
              <span style={{ fontSize: "14px", color: "#374151" }}>{event.startTime} – {event.endTime}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>📅</span>
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {dayjs(event.date).format("dddd, MMMM D, YYYY")}
              </span>
            </div>
            <div>
              <span style={{
                display: "inline-block", padding: "3px 12px", borderRadius: "99px",
                background: APPOINTMENT_COLORS[event.type].bg,
                color: APPOINTMENT_COLORS[event.type].text,
                border: `1px solid ${APPOINTMENT_COLORS[event.type].border}`,
                fontSize: "12px", fontWeight: 600,
              }}>
                {event.type}
              </span>
            </div>
            {event.location && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>📍</span>
                <span style={{ fontSize: "14px", color: "#374151" }}>{event.location}</span>
              </div>
            )}
          </div>

          <button onClick={onEdit} style={{
            width: "100%", padding: "12px",
            background: "linear-gradient(135deg, #d63b6e, #c0254e)",
            color: "#fff", border: "none", borderRadius: "8px",
            fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}>
            Edit Event
          </button>
        </>
      )}
    </div>
  );
};

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home = () => {
  const { auth } = useContext(AuthContext);
  const today = dayjs();

  const [selectedDate, setSelectedDate] = useState<Dayjs>(today);
  const [weekStart, setWeekStart]       = useState<Dayjs>(today.startOf("isoWeek"));
  const [events, setEvents]             = useState<CalendarEvent[]>([]); // ← starts empty
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modal, setModal]               = useState<ModalState>({ open: false, prefill: null });

  const openAdd = (date: string, startTime: string) => {
    const [h] = startTime.split(":").map(Number);
    const endTime = `${String(h + 1).padStart(2, "0")}:00`;
    setModal({ open: true, prefill: { date, startTime, endTime } });
  };

  const openEdit = (evt: CalendarEvent) => setModal({ open: true, prefill: evt });

  const handleSave = (evt: CalendarEvent) => {
    setEvents(prev => {
      const exists = prev.some(e => e.id === evt.id);
      return exists ? prev.map(e => e.id === evt.id ? evt : e) : [...prev, evt];
    });
    setSelectedEvent(evt);
    setModal({ open: false, prefill: null });
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvent(null);
    setModal({ open: false, prefill: null });
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif", background: "#fff" }}>

      {/* Left: Mini Calendar + Legend */}
      <div style={{ width: "240px", flexShrink: 0, padding: "24px 16px", borderRight: "1px solid #e5e7eb", overflowY: "auto" }}>
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={d => { setSelectedDate(d); setWeekStart(d.startOf("isoWeek")); }}
          onWeekChange={setWeekStart}
        />
      </div>

      {/* Center: Weekly Grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827" }}>
              Welcome, {auth.user?.firstname ?? "there"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#6b7280" }}>
              {weekStart.format("MMMM YYYY")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => { setWeekStart(today.startOf("isoWeek")); setSelectedDate(today); }}
              style={{ padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fff", fontSize: "14px", cursor: "pointer", fontWeight: 500, color: "#374151" }}>
              Today
            </button>
            {(["‹", "›"] as const).map((ch, i) => (
              <button key={ch} onClick={() => setWeekStart(w => w.add(i === 0 ? -7 : 7, "day"))}
                style={{ width: "32px", height: "32px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fff", fontSize: "16px", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <WeekGrid
            weekStart={weekStart}
            events={events}
            onSlotClick={openAdd}
            onEventClick={evt => setSelectedEvent(evt)}
          />
        </div>
      </div>

      {/* Right: Event Detail */}
      <div style={{ width: "280px", flexShrink: 0, borderLeft: "1px solid #e5e7eb", overflowY: "auto" }}>
        <EventDetailPanel
          event={selectedEvent}
          onEdit={() => selectedEvent && openEdit(selectedEvent)}
        />
      </div>

      {/* Modal */}
      {modal.open && (
        <EventModal
          prefill={modal.prefill}
          onSave={handleSave}
          onDelete={modal.prefill?.id ? handleDelete : undefined}
          onClose={() => setModal({ open: false, prefill: null })}
        />
      )}
    </div>
  );
};

export default Home;