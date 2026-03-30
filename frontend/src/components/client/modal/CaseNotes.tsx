import { Calendar, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../../api";
import { FormActions, PrimaryBtn } from "../modal/clientElement";

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
    const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
    const cells: (number | null)[] = Array(startDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewDate]);

  const fmt = (d: number) => {
    const m = String(viewDate.month + 1).padStart(2, "0");
    return `${viewDate.year}-${m}-${String(d).padStart(2, "0")}`;
  };

  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div style={{ width: 240, userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={() => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6B7280" }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{monthLabel}</span>
        <button onClick={() => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#6B7280" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, textAlign: "center" }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", padding: "4px 0" }}>{d}</div>
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
              <div style={{
                width: 28, height: 28, lineHeight: "28px",
                borderRadius: "50%",
                fontSize: 12,
                fontWeight: isSelected || hasDot ? 600 : 400,
                backgroundColor: isSelected ? "#D16B7C" : hasDot ? "#FDEAED" : "transparent",
                color: isSelected ? "white" : hasDot ? "#D16B7C" : "#374151",
              }}>
                {d}
              </div>
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <button onClick={() => onSelect(null)} style={{ marginTop: 6, fontSize: 11, color: "#D16B7C", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          Clear filter
        </button>
      )}
    </div>
  );
};

const CaseNotes: React.FC<CaseNotesProps> = ({ personId, onUpdate }) => {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dotDates = useMemo(() => {
    const s = new Set<string>();
    notes.forEach(n => { if (n.date) s.add(n.date.slice(0, 10)); });
    return s;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!selectedDate) return notes;
    return notes.filter(n => n.date?.startsWith(selectedDate));
  }, [notes, selectedDate]);

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

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await api.get("/programs/names");
        setPrograms(res.data);
      } catch (err) {
        console.error("Failed to load programs", err);
      }
    };
    loadPrograms();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditOpen(false); };
    if (editOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editOpen]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/people/${personId}/casenotes`);
        // console.log(res);
        setNotes(res.data);
      } catch (err) {
        console.error("Failed to load notes", err);
      } finally {
        setLoading(false);
      }
    };
    if (personId) loadNotes();
  }, [personId]);

  const handleAddNote = () => {
    setEditNote(null);
    setEditForm({ category: "", program: "", content: "", date: new Date().toISOString().slice(0, 10) });
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
    setEditOpen(true);
  };

  const handleSaveChanges = async () => {
  try {
    setSaving(true);
    if (editNote) {
      // Editing existing note
      await api.put(`people/${personId}/casenotes/${editNote._id}`, {
        category: editForm.category,
        program: editForm.program,
        content: editForm.content,
      });
      setNotes((prev) =>
        prev.map((n) =>
          n._id === editNote._id
            ? { ...n, category: editForm.category, program: editForm.program, content: editForm.content }
            : n,
        ),
      );
    } else {
      // Creating new note
      await api.post(`/people/${personId}/casenotes`, {
        date: editForm.date,
        category: editForm.category,
        content: editForm.content,
        program: editForm.program
      });
      // Re-fetch to get the new note with its _id
      const res = await api.get(`/people/${personId}/casenotes`);
      setNotes(res.data);
    }
    if (onUpdate) onUpdate();
    setEditOpen(false);
  } catch (err) {
    console.error("Failed to save", err);
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

  return (
    <div style={{ width: "100%"}}>
        <div style={{ width: "100%"}}> 
        <FormActions 
            style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginTop: '0px',
                paddingBottom: '0px',
                marginBottom: '0px'
            }}
    >
        <div style={{ marginLeft: '28px', position: 'relative' }}>
          <button
            onClick={() => setCalendarOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              border: '1px solid #E5E7EB', backgroundColor: selectedDate ? '#FDF2F4' : 'white',
              cursor: 'pointer', fontSize: 15, fontWeight: 500, color: '#374151',
            }}
          >
            <Calendar size={16} color="#D16B7C" />
            {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString() : "Filter by date"}
          </button>
          {calendarOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
              backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: 12,
              padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <MiniCalendar selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setCalendarOpen(false); }} dotDates={dotDates} />
            </div>
          )}
        </div>
        <PrimaryBtn
            onClick={handleAddNote}
            style={{ marginBottom: '16px',
                marginRight: '28px'
             }}
        >
            <Plus size={18} /> Add New Case Note
        </PrimaryBtn>
       </FormActions>
       </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          marginLeft: "28px",
          marginRight: "28px"
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
              {["Date", "Category", "Program", "Author","Last Updated By"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "16px 24px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    textAlign: "left"
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
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
              filteredNotes.map((note) => {
                const style = getCategoryStyle(note.category);
                return (
                  <tr
                    key={note._id}
                    onClick={() => handleEditNote(note)}
                    style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#111827",
                        fontWeight: 500,
                      }}
                    >
                      {note.date
                        ? new Date(note.date).toLocaleDateString()
                        : "—"}
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
                    <td style={{ padding: "20px 24px", fontSize: "14px", color: "#9CA3AF" }}>
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
            {/* Header */}
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
              {editNote ? "Make changes to the case note below." : "Fill in the details for the new case note."}
            </p>

            {/* Date — only for new notes */}
            {!editNote && (
              <>
                <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Date</p>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
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

            {/* Category */}
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

            {/* Program */}
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

            {/* Author — read only, hide for new */}
            {editNote && (
              <>
                <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Author</p>
                <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "20px" }}>
                  {editNote.author || "Unknown"}
                </p>
                <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Last Updated By</p>
                <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "20px" }}>
                  {editNote.lastUpdatedBy || "Unknown"}
                </p>
              </>
            )}

            {/* Content */}
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

            {/* Buttons */}
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
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  backgroundColor: "#D16B7C",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : editNote ? "Save Changes" : "Add Case Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseNotes;

// type CaseNote = {
//     content: string;
//     date: string;
//     goalid: string;
// };

// type CaseNotesProps = {
//     personId: string;
// };

// const CaseNotes = ({ personId }: CaseNotesProps) => {
//     const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
//     const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
//     const [noteText, setNoteText] = useState("");
//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);
//     const [errMsg, setErrMsg] = useState("");

//     const dateKey = selectedDate?.format("YYYY-MM-DD");
//     const selectedNote = caseNotes.find((n) => n.date === dateKey);

//     useEffect(() => {
//         setNoteText(selectedNote?.content ?? "");
//     }, [selectedNote]);

//     useEffect(() => {
//         const loadNotes = async () => {
//             try {
//                 setLoading(true);
//                 const res = await api.get(
//                     `/casenotes?person=${personId}`);
//                 setCaseNotes(res.data);
//             } catch {
//                 setErrMsg("Unable to load case notes");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         loadNotes();
//     }, [personId]);

//     const handleSave = async () => {
//         try {
//             setSaving(true);
//             setErrMsg("");
//             const payload = {
//                 personid: personId,
//                 date: selectedDate?.format("YYYY-MM-DD") ?? "",
//                 content: noteText,
//             };
//             await api.post("/casenotes", payload);
//             setCaseNotes((prev) => {
//                 const dateStr = selectedDate?.format("YYYY-MM-DD");
//                 const exists = prev.find((n) => n.date === dateStr);
//                 if (exists) {
//                     return prev.map((n) =>
//                         n.date === dateStr ? { ...n, content: noteText } : n
//                     );
//                 }
//                 return [...prev, { ...payload, goalid: "" }];
//             });
//             alert("Case Note saved successfully");
//         } catch {
//             setErrMsg("Failed to save note");
//         } finally {
//             setSaving(false);
//         }
//     };

//     const recentNotes = [...caseNotes]
//         //.filter((n) => n.date !== dateKey && n.content)
//         .reduce((acc: CaseNote[], note) => {
//             if (!acc.find((n) => n.date === note.date)) acc.push(note);
//             return acc;
//         }, [])
//         .sort((a, b) => (a.date > b.date ? -1 : 1))
//         .slice(0, 5);

//     if (loading) {
//         return (
//             <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
//                 <CircularProgress size={28} />
//             </Box>
//         );
//     }

//     return (
//         <LocalizationProvider dateAdapter={AdapterDayjs}>
//             <Box
//                 sx={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: 2.5,
//                     padding: "20px 28px 28px",
//                 }}
//             >
//                 {/* Select Date */}
//                 <Box>
//                     <Typography
//                         variant="subtitle2"
//                         sx={{ fontWeight: 700, mb: 1, color: palette.deepRed }}
//                     >
//                         Select Date
//                     </Typography>
//                     <Box
//                         sx={{
//                             backgroundColor: "#ffffff",
//                             borderRadius: "12px",
//                             border: "1px solid #e2e2e2",
//                             "& .MuiOutlinedInput-root": {
//                                 backgroundColor: "#ffffff !important",
//                                 borderRadius: "12px",
//                                 "& fieldset": { border: "none" },
//                                 "&:hover fieldset": { border: "none" },
//                                 "&.Mui-focused fieldset": { border: "none" },
//                             },
//                         }}
//                     >
//                         <DatePicker
//                             value={selectedDate}
//                             onChange={(val) => setSelectedDate(val)}
//                             slotProps={{
//                                 textField: {
//                                     fullWidth: true,
//                                     variant: "outlined",
//                                     sx: {
//                                         "& .MuiOutlinedInput-root": {
//                                             backgroundColor: "transparent !important",
//                                             borderRadius: "12px",
//                                         },
//                                     },
//                                 },
//                             }}
//                         />
//                     </Box>
//                 </Box>

//                 <Box>
//                     <Typography
//                         variant="subtitle2"
//                         sx={{ fontWeight: 700, mb: 1, color: palette.deepRed }}
//                     >
//                         Note for {selectedDate?.format("MMMM D, YYYY")}
//                     </Typography>
//                     <TextField
//                         multiline
//                         rows={6}
//                         fullWidth
//                         value={noteText}
//                         onChange={(e) => setNoteText(e.target.value)}
//                         placeholder="Enter case note for this date..."
//                         sx={{
//                             "& .MuiOutlinedInput-root": {
//                                 borderRadius: "12px",
//                                 backgroundColor: palette.white,
//                                 "& fieldset": { border: `1px solid #e2e2e2` },
//                                 "&:hover fieldset": { borderColor: palette.seafoamGreen },
//                                 "&.Mui-focused fieldset": {
//                                     border: `2px solid ${palette.seafoamGreen}`,
//                                 },
//                             },
//                         }}
//                     />
//                 </Box>

//                 {errMsg && (
//                     <Typography variant="caption" color="error">
//                         {errMsg}
//                     </Typography>
//                 )}

//                 <Button
//                     variant="contained"
//                     onClick={handleSave}
//                     disabled={saving}
//                     fullWidth
//                     sx={{
//                         bgcolor: palette.seafoamGreen,
//                         color: palette.white,
//                         borderRadius: "12px",
//                         py: 1.5,
//                         fontWeight: 600,
//                         fontSize: "0.95rem",
//                         textTransform: "none",
//                         boxShadow: "none",
//                         "&:hover": { bgcolor: palette.forestGreen, boxShadow: "none" },
//                         "&.Mui-disabled": { bgcolor: "#9e9e9e", color: palette.white },
//                     }}
//                 >
//                     {saving ? "Saving..." : "Save Case Note"}
//                 </Button>

//                 {/* Recent notes */}
//                 {recentNotes.length > 0 && (
//                     <Box>
//                         <Typography
//                             variant="subtitle2"
//                             sx={{ fontWeight: 700, mb: 1, color: palette.deepRed }}
//                         >
//                             Recent Notes (Last 5)
//                         </Typography>
//                         <Box
//                             sx={{
//                                 border: `1.5px solid ${palette.mintGreen}`,
//                                 borderRadius: "12px",
//                                 overflow: "hidden",
//                             }}
//                         >
//                             {recentNotes.map((note, i) => (
//                                 <Box key={note.date}>
//                                     <Box
//                                         onClick={() => setSelectedDate(dayjs(note.date))}
//                                         sx={{
//                                             px: 2,
//                                             py: 1.5,
//                                             cursor: "pointer",
//                                             "&:hover": { backgroundColor: palette.mintGreen },
//                                         }}
//                                     >
//                                         <Typography
//                                             variant="caption"
//                                             sx={{
//                                                 color: "text.secondary",
//                                                 display: "block",
//                                                 mb: 0.25,
//                                             }}
//                                         >
//                                             {dayjs(note.date).format("MMMM D, YYYY")}
//                                         </Typography>
//                                         <Typography
//                                             variant="body2"
//                                             sx={{
//                                                 overflow: "hidden",
//                                                 display: "-webkit-box",
//                                                 WebkitLineClamp: 2,
//                                                 WebkitBoxOrient: "vertical",
//                                             }}
//                                         >
//                                             {note.content}
//                                         </Typography>
//                                     </Box>
//                                     {i < recentNotes.length - 1 && <Divider />}
//                                 </Box>
//                             ))}
//                         </Box>
//                     </Box>
//                 )}
//             </Box>
//         </LocalizationProvider>
//     );
// };

// export default CaseNotes;