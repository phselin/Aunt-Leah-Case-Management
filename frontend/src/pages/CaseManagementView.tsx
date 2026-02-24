import * as React from 'react';
import axios from 'axios';
import {
  Box, Grid, TextField, Button, Paper, Typography, Container, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import type { TransitionProps } from '@mui/material/transitions';
import { Dialog, Slide } from "@mui/material";
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import CalendarComponent from '../components/calendar';
import { palette } from '../theme/palette';

const COLORS = {
  headerText: palette.deepRed,
  primary: palette.magentaPink,
  secondary: palette.seafoamGreen,
  background: palette.white,
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CaseManagementView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setErrMsg } = useOutletContext<{ setErrMsg: (msg: string) => void }>();
  const [loading, setLoading] = React.useState(false);
  const [clientName, setClientName] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(dayjs());
  const [caseNotes, setCaseNotes] = React.useState<any[]>([]);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [nameRes, notesRes] = await Promise.all([
          axios.get(`http://localhost:8000/people/${id}`, { withCredentials: true }),
          axios.get(`http://localhost:8000/casenotes?person=${id}`, { withCredentials: true })
        ]);
        setClientName(`${nameRes.data.firstname || ""} ${nameRes.data.lastname || ""}`.trim());
        setCaseNotes(notesRes.data || []);
      } catch (err) {
        setErrMsg("Unable to find client notes");
        navigate("/client");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);
  // replaced date with id because otherwise every date change you are fetching the case note

  React.useEffect(() => {
    const dateStr = selectedDate?.format('YYYY-MM-DD');
    const todayNote = caseNotes.find((item: any) => item.date === dateStr);
    setNote(todayNote?.content || "");
  }, [selectedDate, caseNotes]);

  const handleSave = async () => {
    try {
      const dateStr = selectedDate?.format('YYYY-MM-DD');
      const payload = {
        personid: id,
        date: selectedDate?.format('YYYY-MM-DD'),
        content: note
        // TODO goalid (casenotes written with respect to goals, after MVP)
      };

      await axios.post("http://localhost:8000/casenotes", payload, {
        withCredentials: true,
      });

      setCaseNotes(prev => {
        const existing = prev.find(cn => cn.date === dateStr);
        if (existing) {
          return prev.map(cn => cn.date === dateStr ? { ...cn, content: note } : cn);
        }
        return [...prev, payload];
      });

      alert("Note saved successfully!"); // TODO something else instead of this (after MVP)
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Make sure the backend is running at :8000"); // TODO
    }
  };

  return (
    <Dialog fullScreen open={true} onClose={() => navigate("/client")} TransitionComponent={Transition}>
      <Box sx={{ bgcolor: COLORS.background, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ color: COLORS.headerText, fontWeight: 700 }}>
                {clientName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Case Management Dashboard
              </Typography>
            </Box>
            <IconButton onClick={() => navigate("/client")}><CloseIcon /></IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <CalendarComponent value={selectedDate} onChange={(newVal) => setSelectedDate(newVal)} />
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.headerText, fontWeight: 600 }}>
                  Case Notes - {selectedDate?.format('MMMM D, YYYY')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={note}
                  disabled={loading}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={loading ? "Loading..." : "Enter clinical observations here..."}
                  variant="outlined"
                  sx={{
                    flexGrow: 1, mb: 2,
                    '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: 2 }
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{
                    bgcolor: COLORS.secondary, color: '#4a5d4e', fontWeight: 700,
                    '&:hover': { bgcolor: '#b1c4b5' },
                    textTransform: 'none', borderRadius: 2, boxShadow: 'none'
                  }}
                >
                  Save Progress Note
                </Button>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>
    </Dialog>
  );
}

export default CaseManagementView;