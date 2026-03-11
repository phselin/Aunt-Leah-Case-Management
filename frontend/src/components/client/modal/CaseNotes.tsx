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

type CaseNote = {
    content: string;
    date: string;
    goalid: string;
};

type CaseNotesProps = {
    personId: string;
};

const CaseNotes = ({ personId }: CaseNotesProps) => {
    const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [noteText, setNoteText] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    const dateKey = selectedDate?.format("YYYY-MM-DD");
    const selectedNote = caseNotes.find((n) => n.date === dateKey);

    useEffect(() => {
        setNoteText(selectedNote?.content ?? "");
    }, [selectedNote]);

    useEffect(() => {
        const loadNotes = async () => {
            try {
                setLoading(true);
                const res = await api.get(
                    `/casenotes?person=${personId}`);
                setCaseNotes(res.data);
            } catch {
                setErrMsg("Unable to load case notes");
            } finally {
                setLoading(false);
            }
        };
        loadNotes();
    }, [personId]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setErrMsg("");
            const payload = {
                personid: personId,
                date: selectedDate?.format("YYYY-MM-DD") ?? "",
                content: noteText,
            };
            await api.post("/casenotes", payload);
            setCaseNotes((prev) => {
                const dateStr = selectedDate?.format("YYYY-MM-DD");
                const exists = prev.find((n) => n.date === dateStr);
                if (exists) {
                    return prev.map((n) =>
                        n.date === dateStr ? { ...n, content: noteText } : n
                    );
                }
                return [...prev, { ...payload, goalid: "" }];
            });
            alert("Case Note saved successfully");
        } catch {
            setErrMsg("Failed to save note");
        } finally {
            setSaving(false);
        }
    };

    const recentNotes = [...caseNotes]
        //.filter((n) => n.date !== dateKey && n.content)
        .reduce((acc: CaseNote[], note) => {
            if (!acc.find((n) => n.date === note.date)) acc.push(note);
            return acc;
        }, [])
        .sort((a, b) => (a.date > b.date ? -1 : 1))
        .slice(0, 5);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    padding: "20px 28px 28px",
                }}
            >
                {/* Select Date */}
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 1, color: palette.deepRed }}
                    >
                        Select Date
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e2e2",
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: "#ffffff !important",
                                borderRadius: "12px",
                                "& fieldset": { border: "none" },
                                "&:hover fieldset": { border: "none" },
                                "&.Mui-focused fieldset": { border: "none" },
                            },
                        }}
                    >
                        <DatePicker
                            value={selectedDate}
                            onChange={(val) => setSelectedDate(val)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    variant: "outlined",
                                    sx: {
                                        "& .MuiOutlinedInput-root": {
                                            backgroundColor: "transparent !important",
                                            borderRadius: "12px",
                                        },
                                    },
                                },
                            }}
                        />
                    </Box>
                </Box>

                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, mb: 1, color: palette.deepRed }}
                    >
                        Note for {selectedDate?.format("MMMM D, YYYY")}
                    </Typography>
                    <TextField
                        multiline
                        rows={6}
                        fullWidth
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Enter case note for this date..."
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: palette.white,
                                "& fieldset": { border: `1px solid #e2e2e2` },
                                "&:hover fieldset": { borderColor: palette.seafoamGreen },
                                "&.Mui-focused fieldset": {
                                    border: `2px solid ${palette.seafoamGreen}`,
                                },
                            },
                        }}
                    />
                </Box>

                {errMsg && (
                    <Typography variant="caption" color="error">
                        {errMsg}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    fullWidth
                    sx={{
                        bgcolor: palette.seafoamGreen,
                        color: palette.white,
                        borderRadius: "12px",
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": { bgcolor: palette.forestGreen, boxShadow: "none" },
                        "&.Mui-disabled": { bgcolor: "#9e9e9e", color: palette.white },
                    }}
                >
                    {saving ? "Saving..." : "Save Case Note"}
                </Button>

                {/* Recent notes */}
                {recentNotes.length > 0 && (
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, mb: 1, color: palette.deepRed }}
                        >
                            Recent Notes (Last 5)
                        </Typography>
                        <Box
                            sx={{
                                border: `1.5px solid ${palette.mintGreen}`,
                                borderRadius: "12px",
                                overflow: "hidden",
                            }}
                        >
                            {recentNotes.map((note, i) => (
                                <Box key={note.date}>
                                    <Box
                                        onClick={() => setSelectedDate(dayjs(note.date))}
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            cursor: "pointer",
                                            "&:hover": { backgroundColor: palette.mintGreen },
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "text.secondary",
                                                display: "block",
                                                mb: 0.25,
                                            }}
                                        >
                                            {dayjs(note.date).format("MMMM D, YYYY")}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                overflow: "hidden",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                            }}
                                        >
                                            {note.content}
                                        </Typography>
                                    </Box>
                                    {i < recentNotes.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default CaseNotes;