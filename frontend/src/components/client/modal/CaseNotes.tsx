import axios from "axios";
import { Calendar, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api";
import {
  ErrorBox,
  FormActions,
  PrimaryBtn,
  SuccessBox,
} from "../modal/clientElement";

interface CaseNote {
  _id: string;
  content: string;
  date: string;
  personid: string;
  category?: string;
  program?: string;
  author?: string;
  lastUpdatedBy?: string;
}

interface CaseNotesProps {
  personId: string;
  onUpdate?: () => void;
}

const MiniCalendar: React.FC<{
  selectedDate: string | null;
  onSelect: (d: string | null) => void;
  dotDates: Set<string>;
}> = ({ selectedDate, onSelect, dotDates }) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const days = useMemo(() => {
    const first = new Date(viewDate.year, viewDate.month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(
      viewDate.year,
      viewDate.month + 1,
      0,
    ).getDate();
    const cells: (number | null)[] = Array(startDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewDate]);

  const fmt = (d: number) => {
    const m = String(viewDate.month + 1).padStart(2, "0");
    return `${viewDate.year}-${m}-${String(d).padStart(2, "0")}`;
  };

  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleString(
    "default",
    { month: "long", year: "numeric" },
  );

  return (
    <div style={{ width: 240, userSelect: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <button
          onClick={() =>
            setViewDate((v) =>
              v.month === 0
                ? { year: v.year - 1, month: 11 }
                : { ...v, month: v.month - 1 },
            )
          }
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#6B7280",
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          {monthLabel}
        </span>
        <button
          onClick={() =>
            setViewDate((v) =>
              v.month === 11
                ? { year: v.year + 1, month: 0 }
                : { ...v, month: v.month + 1 },
            )
          }
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#6B7280",
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          textAlign: "center",
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#9CA3AF",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}

        {days.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const dateStr = fmt(d);
          const isSelected = selectedDate === dateStr;
          const hasDot = dotDates.has(dateStr);

          return (
            <div
              key={i}
              onClick={() => onSelect(isSelected ? null : dateStr)}
              style={{
                cursor: "pointer",
                padding: "2px 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 28,
                  minHeight: 34,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    lineHeight: "28px",
                    borderRadius: "50%",
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? "#D16B7C" : "transparent",
                    color: isSelected ? "white" : "#374151",
                  }}
                >
                  {d}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: hasDot ? "#DC2626" : "transparent",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelect(null)}
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "#D16B7C",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Clear filter
        </button>
      )}
    </div>
  );
};

const CaseNotes: React.FC<CaseNotesProps> = ({ personId, onUpdate }) => {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [filterType, setFilterType] = useState<"date" | "program" | "category">(
    "date",
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dotDates, setDotDates] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editNote, setEditNote] = useState<CaseNote | null>(null);
  const [editForm, setEditForm] = useState({
    category: "",
    program: "",
    content: "",
    date: "",
  });
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState<string[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [modalErrMsg, setModalErrMsg] = useState("");
  const [saveBtnHover, setSaveBtnHover] = useState(false);

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return "—";

    const dateOnly = dateStr.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString();
  };

  useEffect(() => {
    if (errMsg) {
      const timer = setTimeout(() => setErrMsg(""), 3000);
      return () => clearTimeout(timer);
    }
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
    if (modalErrMsg) {
      const timer = setTimeout(() => setModalErrMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errMsg, successMsg, modalErrMsg]);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await api.get("/programs/names");
        setPrograms(res.data);
      } catch (err) {
        console.error("Failed to load programs", err);
        setErrMsg("Failed to load programs");
      }
    };
    loadPrograms();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditOpen(false);
    };
    if (editOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editOpen]);

  const loadNotes = async (
    date?: string | null,
    search?: string,
    program?: string,
    category?: string,
  ) => {
    try {
      if (loading) return;
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (date) params.set("date", date);
      if (program) params.set("program", program);
      if (category) params.set("category", category);

      const query = params.toString();
      const url = `/people/${personId}/casenotes${query ? `?${query}` : ""}`;
      const res = await api.get(url);
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to load notes", err);

      if (axios.isAxiosError(err)) {
        console.log("status:", err.response?.status);
        console.log("data:", err.response?.data);

        setErrMsg(
          err.response?.data?.detail ||
            `Failed to load case notes (${err.response?.status || "unknown error"})`,
        );
      } else {
        setErrMsg("Failed to load case notes");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDotDates = async () => {
    try {
      const res = await api.get(`/people/${personId}/casenotes/dates`);
      setDotDates(new Set((res.data as string[]).map((d) => d.split("T")[0])));
    } catch (err) {
      console.error("Failed to load casenote dates", err);
    }
  };

  const reloadNotes = () => {
    loadNotes(
      filterType === "date" ? selectedDate : null,
      searchQuery,
      filterType === "program" ? selectedProgram : "",
      filterType === "category" ? selectedCategory : "",
    );
  };

  const handleFilterTypeChange = (type: "date" | "program" | "category") => {
    setFilterType(type);
    setSelectedDate(null);
    setSelectedProgram("");
    setSelectedCategory("");
    setCalendarOpen(false);
  };

  const didMountRef = useRef(false);

  useEffect(() => {
    if (!personId) return;
    loadDotDates();
  }, [personId]);

  useEffect(() => {
    if (!personId) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    reloadNotes();
  }, [selectedDate, selectedProgram, selectedCategory, filterType]);

  useEffect(() => {
    if (!personId) return;
    reloadNotes();
  }, [personId]);

  useEffect(() => {
    if (!personId) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      reloadNotes();
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleAddNote = () => {
    setEditNote(null);
    setEditForm({
      category: "",
      program: "",
      content: "",
      date: new Date().toLocaleDateString("en-CA"),
    });
    setModalErrMsg("");
    setSuccessMsg("");
    setEditOpen(true);
  };

  const handleEditNote = (note: CaseNote) => {
    setEditNote(note);
    setEditForm({
      category: note.category || "",
      program: note.program || "",
      content: note.content || "",
      date: note.date?.slice(0, 10) || "",
    });
    setModalErrMsg("");
    setSuccessMsg("");
    setEditOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setModalErrMsg("");
      if (editForm.content.trim().split(/\s+/).length > 200) {
        setModalErrMsg("Content cannot exceed 200 words");
        setSaving(false);
        return;
      }
      if (editNote) {
        await api.put(`people/${personId}/casenotes/${editNote._id}`, {
          category: editForm.category,
          program: editForm.program,
          content: editForm.content,
        });
        setNotes((prev) =>
          prev.map((n) =>
            n._id === editNote._id
              ? {
                  ...n,
                  category: editForm.category,
                  program: editForm.program,
                  content: editForm.content,
                }
              : n,
          ),
        );
        await loadDotDates();
      } else {
        await api.post(`/people/${personId}/casenotes`, {
          date: editForm.date,
          category: editForm.category,
          content: editForm.content,
          program: editForm.program,
        });
        await reloadNotes();
        await loadDotDates();
      }
      if (onUpdate) onUpdate();
      setEditOpen(false);
      setErrMsg("");
      setSuccessMsg(
        editNote
          ? "Case note updated successfully"
          : "Case note added successfully",
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setModalErrMsg(
          "You do not have the permission outside your assigned programs",
        );
      } else {
        setModalErrMsg("Please set date and content");
      }
    } finally {
      setSaving(false);
    }
  };

  const getCategoryStyle = (cat?: string) => {
    switch (cat) {
      case "Crisis":
        return { bg: "#FEE2E2", text: "#B91C1C" };
      case "Assessment":
        return { bg: "#DBEAFE", text: "#1D4ED8" };
      case "Follow-up":
        return { bg: "#EDE9FE", text: "#6D28D9" };
      case "Support":
        return { bg: "#DCFCE7", text: "#15803D" };
      default:
        return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  const today = new Date();

  return (
    <div style={{ width: "100%" }}>
      <div style={{ width: "100%" }}>
        <FormActions
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            marginTop: "0px",
            paddingBottom: "0px",
            marginBottom: "0px",
          }}
        >
          <div
            style={{
              marginLeft: "28px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
            }}
          >
            <select
              value={filterType}
              onChange={(e) =>
                handleFilterTypeChange(
                  e.target.value as "date" | "program" | "category",
                )
              }
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                backgroundColor: "white",
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <option value="date">Date</option>
              <option value="program">Program</option>
              <option value="category">Category</option>
            </select>

            {filterType === "date" && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setCalendarOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    backgroundColor: selectedDate ? "#FDF2F4" : "white",
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#374151",
                    minWidth: "170px",
                  }}
                >
                  <Calendar size={16} color="#D16B7C" />
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString()
                    : "Filter by date"}
                </button>

                {calendarOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: 4,
                      zIndex: 50,
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 12,
                      padding: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <MiniCalendar
                      selectedDate={selectedDate}
                      onSelect={(d) => {
                        setSelectedDate(d);
                        setCalendarOpen(false);
                      }}
                      dotDates={dotDates}
                    />
                  </div>
                )}
              </div>
            )}

            {filterType === "program" && (
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  backgroundColor: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
              >
                <option value="">All programs</option>
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            )}

            {filterType === "category" && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  backgroundColor: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#374151",
                  cursor: "pointer",
                  minWidth: "180px",
                }}
              >
                <option value="">All categories</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Assessment">Assessment</option>
                <option value="Crisis">Crisis</option>
                <option value="Support">Support</option>
              </select>
            )}
          </div>

          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: "absolute",
                left: "16px",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <path
                d="M19 19L14.65 14.65M17 9C17 13.4183 13.4183 17 9 17C4.58172 17 1 13.4183 1 9C1 4.58172 4.58172 1 9 1C13.4183 1 17 4.58172 17 9Z"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "48px",
                paddingRight: "16px",
                paddingTop: "9px",
                paddingBottom: "9px",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                color: "#374151",
                outline: "none",
                fontFamily: "Poppins, sans-serif",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#D16B7C";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(209,107,124,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
              }}
            />
          </div>

          <PrimaryBtn
            onClick={handleAddNote}
            style={{ marginBottom: "16px", marginRight: "28px" }}
          >
            <Plus size={18} /> Add New Case Note
          </PrimaryBtn>
        </FormActions>
      </div>

      <div style={{ marginLeft: "28px", marginRight: "28px" }}>
        {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
        {successMsg && <SuccessBox>{successMsg}</SuccessBox>}
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          marginLeft: "28px",
          marginRight: "28px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #F3F4F6",
                backgroundColor: "#FAFAFA",
              }}
            >
              {["Date", "Category", "Program", "Author", "Last Updated By"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "16px 24px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading && notes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#9CA3AF",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : (
              notes.map((note) => {
                const style = getCategoryStyle(note.category);
                return (
                  <tr
                    key={note._id}
                    onClick={() => handleEditNote(note)}
                    style={{
                      borderBottom: "1px solid #F9FAFB",
                      cursor: "pointer",
                    }}
                  >
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#111827",
                        fontWeight: 500,
                      }}
                    >
                      {formatDateOnly(note.date)}
                    </td>
                    <td style={{ padding: "20px 24px" }}>
                      <span
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          padding: "4px 12px",
                          borderRadius: "99px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {note.category || "None"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#4B5563",
                      }}
                    >
                      {note.program || "No Program Selected"}
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#9CA3AF",
                      }}
                    >
                      {note.author || "Unknown"}
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#9CA3AF",
                      }}
                    >
                      {note.lastUpdatedBy || "Unknown"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <div
          onClick={() => setEditOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              width: "600px",
              maxWidth: "90vw",
              position: "relative",
            }}
          >
            <button
              onClick={() => setEditOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                color: "#9CA3AF",
              }}
            >
              ✕
            </button>

            <h2
              style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}
            >
              {editNote ? "Edit Case Note" : "Add Case Note"}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#9CA3AF",
                marginBottom: "24px",
              }}
            >
              {editNote
                ? "Make changes to the case note below."
                : "Fill in the details for the new case note."}
            </p>

            {modalErrMsg && <ErrorBox>{modalErrMsg}</ErrorBox>}

            {!editNote && (
              <>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  Date
                </p>
                <input
                  type="date"
                  value={editForm.date}
                  min={new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    today.getDate(),
                  ).toLocaleDateString("en-CA")}
                  max={today.toLocaleDateString("en-CA")}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    marginBottom: "20px",
                    backgroundColor: "#F9FAFB",
                    boxSizing: "border-box",
                  }}
                />
              </>
            )}

            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}
            >
              Category
            </p>
            <select
              value={editForm.category}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, category: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                marginBottom: "20px",
                backgroundColor: "#F9FAFB",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Select category</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Assessment">Assessment</option>
              <option value="Crisis">Crisis</option>
              <option value="Support">Support</option>
            </select>

            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}
            >
              Program
            </p>
            <select
              value={editForm.program}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, program: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                marginBottom: "20px",
                backgroundColor: "#F9FAFB",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Select program</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>

            {editNote && (
              <>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  Author
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#9CA3AF",
                    marginBottom: "20px",
                  }}
                >
                  {editNote.author || "Unknown"}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  Last Updated By
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#9CA3AF",
                    marginBottom: "20px",
                  }}
                >
                  {editNote.lastUpdatedBy || "Unknown"}
                </p>
              </>
            )}

            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}
            >
              Content
            </p>
            <textarea
              value={editForm.content}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={5}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "14px",
                marginBottom: "32px",
                backgroundColor: "#F9FAFB",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setEditOpen(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                onMouseEnter={() => setSaveBtnHover(true)}
                onMouseLeave={() => setSaveBtnHover(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  backgroundColor: saveBtnHover ? "#b95a6a" : "#D16B7C",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: saving ? 0.7 : 1,
                  transition: "background-color 0.2s",
                }}
              >
                {saving
                  ? "Saving..."
                  : editNote
                    ? "Save Changes"
                    : "Add Case Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseNotes;