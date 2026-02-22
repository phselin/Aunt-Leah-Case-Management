import { useEffect, useMemo, useState } from "react";
import {
  ItineraryCard,
  ItineraryTitle,
  ItineraryDate,
  AddEventBtn,
  EventList,
  EventItemCard,
  EventTitle,
  EventTime,
  EventNotes,
  EventActions,
  ActionBtn,
  FormRow,
  Label,
  Input,
  TextArea,
  FormActions,
  SecondaryBtn,
} from "./homeElement";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type EventItem = {
  id: string;
  title: string;
  time: string;
  notes?: string;
};

type EventsByDate = Record<string, EventItem[]>;

type ItineraryProps = {
  value: Value;
};

const STORAGE_KEY = "home_itinerary_events_v1";

function toDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const Itinerary = ({ value }: ItineraryProps) => {
  const selectedDate = useMemo(() => {
    const d = Array.isArray(value) ? value[0] : value;
    return d ?? new Date();
  }, [value]);

  const dateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const eventsForDay = eventsByDate[dateKey] ?? [];


  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");


  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as EventsByDate;
      if (parsed && typeof parsed === "object") setEventsByDate(parsed);
    } catch {
      
    }
  }, []);


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsByDate));
    } catch {
      
    }
  }, [eventsByDate]);

  const openAdd = () => {
    setEditingId(null);
    setTitle("");
    setTime("");
    setNotes("");
    setIsFormOpen(true);
  };

  const openEdit = (e: EventItem) => {
    setEditingId(e.id);
    setTitle(e.title);
    setTime(e.time);
    setNotes(e.notes ?? "");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTitle("");
    setTime("");
    setNotes("");
  };

  const saveEvent = () => {
    const cleanTitle = title.trim();
    const cleanTime = time.trim();

    if (!cleanTitle || !cleanTime) {
      
      alert("Please enter a title and time.");
      return;
    }

    setEventsByDate((prev) => {
      const day = prev[dateKey] ?? [];

      
      if (editingId) {
        const updated = day.map((ev) =>
          ev.id === editingId
            ? { ...ev, title: cleanTitle, time: cleanTime, notes: notes.trim() || undefined }
            : ev
        );
        return { ...prev, [dateKey]: updated };
      }

      
      const newEvent: EventItem = {
        id: newId(),
        title: cleanTitle,
        time: cleanTime,
        notes: notes.trim() || undefined,
      };

      return { ...prev, [dateKey]: [...day, newEvent] };
    });

    closeForm();
  };

  const deleteEvent = (id: string) => {
    setEventsByDate((prev) => {
      const day = prev[dateKey] ?? [];
      const updated = day.filter((ev) => ev.id !== id);
      return { ...prev, [dateKey]: updated };
    });
  };

  return (
    <ItineraryCard>
      <ItineraryTitle>Itinerary</ItineraryTitle>
      <ItineraryDate>{selectedDate.toDateString()}</ItineraryDate>

      <AddEventBtn type="button" onClick={openAdd}>
        + Add Event
      </AddEventBtn>

      {isFormOpen ? (
        <div>
          <FormRow>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Client Meeting" />
          </FormRow>

          <FormRow>
            <Label>Time</Label>
            <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g., 10:00 AM" />
          </FormRow>

          <FormRow>
            <Label>Notes</Label>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
          </FormRow>

          <FormActions>
            <SecondaryBtn type="button" onClick={closeForm}>
              Cancel
            </SecondaryBtn>
            <AddEventBtn type="button" onClick={saveEvent}>
              {editingId ? "Save Changes" : "Add Event"}
            </AddEventBtn>
          </FormActions>
        </div>
      ) : null}

      <EventList>
        {eventsForDay.length === 0 ? (
          <EventItemCard>
            <EventNotes>No events for this day yet.</EventNotes>
          </EventItemCard>
        ) : (
          eventsForDay.map((e) => (
            <EventItemCard key={e.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <EventTitle>{e.title}</EventTitle>
                  <EventTime>{e.time}</EventTime>
                  {e.notes ? <EventNotes>{e.notes}</EventNotes> : null}
                </div>

                <EventActions>
                  <ActionBtn type="button" onClick={() => openEdit(e)}>✎</ActionBtn>
                  <ActionBtn type="button" onClick={() => deleteEvent(e.id)}>🗑</ActionBtn>
                </EventActions>
              </div>
            </EventItemCard>
          ))
        )}
      </EventList>
    </ItineraryCard>
  );
};

export default Itinerary;