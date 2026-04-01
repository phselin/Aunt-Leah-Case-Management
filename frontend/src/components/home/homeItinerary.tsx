import { useEffect, useMemo, useRef, useState } from "react";
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
  TimePickerWrapper,
  TimeDropdown,
  TimeOption,
} from "./homeElement";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import api from "../../api";

type EventItem = {
  _id: string;
  title: string;
  time: string;
  date: string;
  notes?: string;
};

type ItineraryProps = {
  value: Dayjs | null;
};

function toDateKey(d: Dayjs) {
  return d.format(`YYYY-MM-DD`);
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const suffix = h < 12 ? "AM" : "PM";
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m} ${suffix}`;
});

const VALID_TIME_RE = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

const Itinerary = ({ value }: ItineraryProps) => {

  const selectedDate = useMemo(() => {
    return value ?? dayjs();
  }, [value]);

  const dateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const [eventsForDay, setEventsForDay] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const timeWrapperRef = useRef<HTMLDivElement>(null);

  const filteredTimeOptions = useMemo(() => {
    const q = time.trim().toLowerCase();
    if (!q) return TIME_OPTIONS;
    return TIME_OPTIONS.filter((t) => t.toLowerCase().includes(q));
  }, [time]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeWrapperRef.current && !timeWrapperRef.current.contains(e.target as Node)) {
        setTimeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/calendar-events?date=${dateKey}`);
        if (isMounted) {
          setEventsForDay(res.data);
        }
      } catch (error) {
        console.error("Error loading itinerary events:", error);
        if (isMounted) {
          setEventsForDay([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, [dateKey]);

  const openAdd = () => {
    setEditingId(null);
    setTitle("");
    setTime("");
    setNotes("");
    setIsFormOpen(true);
  };

  const openEdit = (e: EventItem) => {
    setEditingId(e._id);
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
    setTimeDropdownOpen(false);
  };

  const saveEvent = async () => {
    const cleanTitle = title.trim();
    const cleanTime = time.trim();

    if (!cleanTitle || !cleanTime) {
      alert("Please enter a title and time.");
      return;
    }

    if (!VALID_TIME_RE.test(cleanTime)) {
      alert("Please enter a valid time (e.g., 10:00 AM).");
      return;
    }

    const payload = {
      title: cleanTitle,
      time: cleanTime,
      date: dateKey,
      notes: notes.trim() || undefined,
    };

    try {
      if (editingId) {
        const res = await api.put(`/calendar-events/${editingId}`, payload);
        setEventsForDay((prev) =>
          prev.map((event) => (event._id === editingId ? res.data : event))
        );
      } else {
        const res = await api.post("/calendar-events", payload);
        setEventsForDay((prev) => [...prev, res.data]);
      }

      closeForm();
    } catch (error: any) {
      console.error("Error saving itinerary event:", error);
      alert(error?.response?.data?.detail ?? "Unable to save event right now.");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/calendar-events/${id}`);
      setEventsForDay((prev) => prev.filter((event) => event._id !== id));
    } catch (error: any) {
      console.error("Error deleting itinerary event:", error);
      alert(error?.response?.data?.detail ?? "Unable to delete event right now.");
    }
  };

  return (
    <ItineraryCard>
      <ItineraryTitle>Itinerary</ItineraryTitle>
      <ItineraryDate>{selectedDate.format(`ddd MMM DD YYYY`)}</ItineraryDate>

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
            <TimePickerWrapper ref={timeWrapperRef}>
              <Input
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setTimeDropdownOpen(true);
                }}
                onFocus={() => setTimeDropdownOpen(true)}
                placeholder="e.g., 10:00 AM"
                autoComplete="off"
              />
              {timeDropdownOpen && filteredTimeOptions.length > 0 && (
                <TimeDropdown>
                  {filteredTimeOptions.map((t) => (
                    <TimeOption
                      key={t}
                      $highlighted={t === time}
                      onClick={() => {
                        setTime(t);
                        setTimeDropdownOpen(false);
                      }}
                    >
                      {t}
                    </TimeOption>
                  ))}
                </TimeDropdown>
              )}
            </TimePickerWrapper>
          </FormRow>

          <FormRow>
            <Label>Notes</Label>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
          </FormRow>

          <FormActions>
            <SecondaryBtn type="button" onClick={closeForm}>
              Cancel
            </SecondaryBtn>
            <AddEventBtn type="button" onClick={() => void saveEvent()}>
              {editingId ? "Save Changes" : "Add Event"}
            </AddEventBtn>
          </FormActions>
        </div>
      ) : null}

      <EventList>
        {isLoading ? (
          <EventItemCard>
            <EventNotes>Loading events...</EventNotes>
          </EventItemCard>
        ) : eventsForDay.length === 0 ? (
          <EventItemCard>
            <EventNotes>No events for this day yet.</EventNotes>
          </EventItemCard>
        ) : (
          eventsForDay.map((e) => (
            <EventItemCard key={e._id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <EventTitle>{e.title}</EventTitle>
                  <EventTime>{e.time}</EventTime>
                  {e.notes ? <EventNotes>{e.notes}</EventNotes> : null}
                </div>

                <EventActions>
                  <ActionBtn type="button" onClick={() => openEdit(e)}>✎</ActionBtn>
                  <ActionBtn type="button" onClick={() => void deleteEvent(e._id)}>🗑</ActionBtn>
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
