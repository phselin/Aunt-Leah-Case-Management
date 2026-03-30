import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { palette } from "../../../theme/palette";
import api from "../../../api";
import { ChevronLeft, Plus, Eye, Edit2 } from "lucide-react";
import { PrimaryBtn, SecondaryBtn,FormActions } from "../modal/clientElement";

interface CaseNote {
  _id: string;
  content: string;
  date: string;
  personid: string;
  category?: string;
  program?: string;
  author?: string;
  lastupdatedby?: string;
}

interface CaseNotesProps {
  personId: string;
  onUpdate?: () => void;
}

const CaseNotes: React.FC<CaseNotesProps> = ({ personId, onUpdate }) => {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CaseNote | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editNote, setEditNote] = useState<CaseNote | null>(null);
  const [editForm, setEditForm] = useState({
    category: "",
    program: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

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

  const handleAddNote = async () => {
    // try {
    //   // TODO: Replace the placeholder payload with your actual form data
    //   const res = await api.post(`/casenotes`, {
    //     personid: personId,
    //     content: "Placeholder content",   // TODO: Replace with real form field value
    //     date: new Date().toISOString(),    // TODO: Replace with user-selected date
    //     category: "Update",               // TODO: Replace with selected category
    //     program: "Unknown",               // TODO: Replace with selected program
    //     author: "Current User",           // TODO: Replace with authenticated user
    //   });
    //   // TODO: Decide whether to append res.data to notes or re-fetch the full list
    //   setNotes((prev) => [res.data, ...prev]);
    // } catch (err) {
    //   console.error("Failed to add note", err);
    // }
  };

  const handleViewNote = (note: CaseNote) => {
    setSelectedNote(note);
    setViewOpen(true);
  };

  const handleEditNote = (note: CaseNote) => {
    setEditNote(note);
    setEditForm({
      category: note.category ?? "",
      program: note.program ?? "",
      content: note.content ?? "",
    });
    setEditOpen(true);
  };

  const handleSaveChanges = async () => {
  if (!editNote) return;
  try {
    setSaving(true);
    await api.put(`people/${personId}/casenotes/${editNote._id}`, {
      category: editForm.category,
      program: editForm.program,
      content: editForm.content,
    });

    // Update state with the form values directly — don't rely on res.data shape
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

    if (onUpdate) onUpdate();
    setEditOpen(false);
  } catch (err) {
    console.error("Failed to save changes", err);
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
      default:
        return { bg: "#DCFCE7", text: "#15803D" };
    }
  };

  return (
    <div style={{ width: "100%"}}>
        <div style={{ width: "100%"}}> {/* Changed bottom padding to 0 */}
        <FormActions 
            style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', // Pushes button to the far right
                marginTop: '0px',          // Space between the last card and the button
                paddingBottom: '0px',       // Removes internal bottom spacing
                marginBottom: '0px'         // Removes external bottom spacing
            }}
    >
   
        <PrimaryBtn
            onClick={handleAddNote} // TODO: Swap for a modal open handler if you add a form modal
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
              {["Date", "Category", "Program", "Author","Last Updated By", "Actions"].map((h) => (
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
              notes.map((note) => {
                const style = getCategoryStyle(note.category);
                return (
                  <tr
                    key={note._id}
                    style={{ borderBottom: "1px solid #F9FAFB" }}
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
                        {note.category ?? "Update Required"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#4B5563",
                      }}
                    >
                      {note.program ?? "No Program Logged"}
                    </td>
                    <td
                      style={{
                        padding: "20px 24px",
                        fontSize: "14px",
                        color: "#9CA3AF",
                      }}
                    >
                      {note.author ?? "Unknown"}
                    </td>
                    <td style={{ padding: "20px 24px", fontSize: "14px", color: "#9CA3AF" }}>
                        {note.lastupdatedby ?? "Unknown"}
                    </td>
                    <td style={{ padding: "20px 24px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                          gap: "16px",
                          color: "#D1D5DB",
                        }}
                      >
                        <button
                          onClick={() => handleViewNote(note)} // pass the whole note, not just the id
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "inherit",
                          }}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditNote(note)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "inherit",
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* View Case Note Modal */}
      {viewOpen && selectedNote && (
        <div
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
              onClick={() => setViewOpen(false)}
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
              View Case Note
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#9CA3AF",
                marginBottom: "24px",
              }}
            >
              View the details of the selected case note.
            </p>

            {/* Category */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}
            >
              Category
            </p>
            <span
              style={{
                ...getCategoryStyle(selectedNote.category),
                // reuse your existing badge style
                backgroundColor: getCategoryStyle(selectedNote.category).bg,
                color: getCategoryStyle(selectedNote.category).text,
                padding: "4px 12px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-block",
                marginBottom: "20px",
              }}
            >
              {selectedNote.category ?? "Needs update"}
            </span>

            {/* Program */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}
            >
              Program
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4B5563",
                marginBottom: "20px",
              }}
            >
              {selectedNote.program ?? "Needs update"}
            </p>

            {/* Author */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}
            >
              Author
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4B5563",
                marginBottom: "20px",
              }}
            >
              {selectedNote.author ?? "Needs update"}
            </p>

            {/* Last Updated By */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}
            >
              Last Updated By
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4B5563",
                marginBottom: "20px",
              }}
            >
              {selectedNote.lastupdatedby ?? "Needs update"}{" "}
              {/* TODO: replace with real lastUpdatedBy field when available */}
            </p>

            {/* Content */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}
            >
              Content
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4B5563",
                lineHeight: "1.6",
                marginBottom: "32px",
              }}
            >
              {selectedNote.content ?? "Needs update"}
            </p>

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setViewOpen(false)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {editOpen && editNote && (
        <div
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
              Edit Case Note
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#9CA3AF",
                marginBottom: "24px",
              }}
            >
              Make changes to the case note below.
            </p>

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
              <option value="Housing Support">Housing Support</option>
              <option value="Employment">Employment</option>
              <option value="Mental Health">Mental Health</option>
            </select>

            {/* Author — read only */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}
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
              {editNote.author ?? "Needs update"}
            </p>

            {/* Last Updated By — read only */}
            <p
              style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}
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
              {editNote.author ?? "Needs update"}{" "}
              {/* TODO: replace with real lastUpdatedBy field */}
            </p>

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
                {saving ? "Saving..." : "Save Changes"}
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
