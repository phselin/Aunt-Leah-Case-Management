import {type ReactNode, useEffect, useState} from "react";
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
} from '@mui/material'
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { palette } from "../theme/palette";
import {useForm} from "react-hook-form";
import {type Person, personSchema} from "../components/client/search/person.ts";
import {zodResolver} from "@hookform/resolvers/zod";


type CaseNote = {
  content: string
  date: string
  goalid: string
}

const SelectedView = {
  CaseNotes: "CaseNotes",
  Program: "Program",
} as const;


type SelectedViewType = typeof SelectedView[keyof typeof SelectedView];

export default function CaseManagementView() {
  const [errMsg, setErrMsg] = useState('')
  const [curView, setCurView] = useState<SelectedViewType>(SelectedView.CaseNotes);

  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <Dialog
      open
      onClose={() => navigate('/client')}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0 24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111' }}>Case Notes</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>
            {errMsg || 'View and manage notes by date'}
          </p>
        </div>
        <button
          onClick={() => navigate('/client')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, color: '#666', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px 16px 24px',
        width: "full"
      }}>
        <div
            style={{display: 'inline-flex', background: '#f0f0f0', borderRadius: 10, padding: 4, position: 'relative'}}>
          <div
              style={{
                position: 'absolute',
                top: 4,
                left: curView === SelectedView.CaseNotes ? 4 : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
                height: 'calc(100% - 8px)',
                background: '#fff',
                borderRadius: 8,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
          />
          <button
              onClick={() => setCurView(SelectedView.CaseNotes)}
              style={{
                position: 'relative',
                padding: '8px 20px',
                border: 'none',
                background: 'transparent',
                color: curView === SelectedView.CaseNotes ? '#111' : '#666',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                zIndex: 1,
                transition: 'color 0.2s ease',
              }}
          >
            Case Notes
          </button>
          <button
              onClick={() => setCurView(SelectedView.Program)}
              style={{
                position: 'relative',
                padding: '8px 20px',
                border: 'none',
                background: 'transparent',
                color: curView === SelectedView.Program ? '#111' : '#666',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                zIndex: 1,
                transition: 'color 0.2s ease',
              }}
          >
            Program
          </button>
        </div>
      </div>


      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px 16px 24px',
        width: "full"
      }}>
        {(() => {
          switch (curView) {
            case SelectedView.CaseNotes:
              return (
                <DialogContent sx={{ overflowY: 'auto' }}>
                  <CaseNotesView/>
                </DialogContent>
              )
            case SelectedView.Program:
              return <ProgramsView personId={id || ""}/>;
            default: {
              // Exhaustiveness check - TypeScript will error if a case is missing
              const _exhaustive: never = curView;
              return _exhaustive;
              
            }
          }
        })()}
      </div>
    </Dialog>
  )
}



function CaseNotesView() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([])
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())
  const [noteText, setNoteText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const dateKey = selectedDate?.format('YYYY-MM-DD')
  const selectedNote = caseNotes.find((n) => n.date === dateKey)

  useEffect(() => {
    setNoteText(selectedNote?.content ?? '')
  }, [dateKey, caseNotes])

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`http://localhost:8000/casenotes?person=${id}`, { withCredentials: true })
        setCaseNotes(res.data)
      } catch (err) {
        setErrMsg('Unable to find client details')
        navigate('/client')
      } finally {
        setLoading(false)
      }
    }
    loadClient()
  }, [id])

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrMsg('')
      const payload = {
        personid: id,
        date: selectedDate?.format('YYYY-MM-DD') ?? '',
        content: noteText,
      }
      await axios.post('http://localhost:8000/casenotes', payload, { withCredentials: true })
      setCaseNotes((prev) => {
        const dateStr = selectedDate?.format('YYYY-MM-DD')
        const exists = prev.find((n) => n.date === dateStr)
        if (exists) {
          return prev.map((n) => (n.date === dateStr ? { ...n, content: noteText } : n))
        }
        return [...prev, { ...payload, goalid: '' }]
      })
    } catch (err) {
      setErrMsg('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const recentNotes = [...caseNotes]
    .filter((n) => n.date !== dateKey && n.content)
    .reduce((acc: CaseNote[], note) => {
      if (!acc.find((n) => n.date === note.date)) acc.push(note)
      return acc
    }, [])
    .sort((a: CaseNote, b: CaseNote) => (a.date > b.date ? -1 : 1))
    .slice(0, 5)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* Select Date */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Select Date
          </Typography>
          <DatePicker
            value={selectedDate}
            onChange={(val) => setSelectedDate(val)}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } },
              },
            }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Note for {selectedDate?.format('MMMM D, YYYY')}
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter case note for this date..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#f5f5f5',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: '1.5px solid #1a1a1a' },
              },
            }}
          />
        </Box>

        {errMsg && (
          <Typography variant="caption" color="error">{errMsg}</Typography>
        )}

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          fullWidth
          sx={{
            bgcolor: '#1a1a1a',
            color: '#fff',
            borderRadius: '12px',
            py: 1.5,
            fontWeight: 600,
            fontSize: '0.95rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#333', boxShadow: 'none' },
            '&.Mui-disabled': { bgcolor: '#9e9e9e', color: '#fff' },
          }}
        >
          {saving ? 'Saving...' : 'Save Case Note'}
        </Button>

        {/* recent notes */}
        
        {recentNotes.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Recent Notes (Last 5)
            </Typography>
            <Box sx={{ border: '1.5px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
              {recentNotes.map((note, i) => (
                <Box key={note.date}>
                  <Box
                    onClick={() => setSelectedDate(dayjs(note.date))}
                    sx={{ px: 2, py: 1.5, cursor: 'pointer', '&:hover': { backgroundColor: '#fafafa' } }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
                      {dayjs(note.date).format('MMMM D, YYYY')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
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
  )
}
// end of casenotes




type Program = {
    program: string;
    status: string;
}

type ProgramsViewProps = {
    personId: string;
}
function ProgramsView({personId}: ProgramsViewProps) {
    const [programMilestones, setProgramMilestones] = useState<Map<string, Array<string>>>(
        () => new Map()
    );
    const [failedToFetch, setFailedToFetch] = useState<Array<string>>(() => [])
    const [selectedMilestones, setSelectedMilestones] = useState<Map<string, string>>(
        () => new Map()
    );

    const changeSelectedMilestone = (program: string, value: string) => {
        setSelectedMilestones(selectedMilestones => new Map(selectedMilestones).set(program, value))
    }

    // I know looping await is shit, but it works for now
    const saveProgramData = async () => {
        try {

            const payload: { milestones: Record<string, unknown> } = {milestones: {}}
            for (const [p, v] of selectedMilestones.entries()) {
                payload.milestones[p] = v
            }
            await axios.put(`http://localhost:8000/people/${personId}/milestones`, payload,
                {withCredentials: true})
        }
        catch (e) {
            console.log(e);
        }
    }

    //Load programs
    const [enrolledPrograms, setEnrolledPrograms] = useState<Program[]>([]);

    useEffect(() => {
        const loadClientPrograms = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/programs?person=${personId}`, { withCredentials: true })
                const programs = res.data.map((respr: any) => ({
                    program: respr.program,
                    status: respr.status,
                }));
                setEnrolledPrograms(programs);
            }
            catch (err) {
                console.log(`error ar CaseManagementView:330 : ${err}`)
            }
        }
        loadClientPrograms()
    }, [personId, setEnrolledPrograms])

    useEffect(() => {
        const getAllMilestones = async ()=> {

            for (const ep of enrolledPrograms) {
                try {
                    const res = await axios.get(`http://localhost:8000/programs/${ep.program}/milestones`, {withCredentials: true})
                    setProgramMilestones(programMilestones => new Map(programMilestones).set(ep.program, res.data.general))
                    console.log(`Data added to map: ${res.data.general}`);
                } catch (e) {
                    setFailedToFetch(failedToFetch => [...failedToFetch, ep.program]);
                    console.error(`Failed to fetch ${ep.program}`)
                }
            }
        };
        getAllMilestones();
    }, [enrolledPrograms]);

    useEffect(() => {
        const syncSelectedMilestonees = async () =>
        {
            for (const {program, status} of enrolledPrograms) {
                changeSelectedMilestone(program, status);
            }
        }
        syncSelectedMilestonees();
    }, [enrolledPrograms]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '0 24px 16px 24px',
            width: "100%"
        }}>
            { /*Programs and their status*/ }
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '0 24px 16px 24px',
                width: "full"
            }}>
                {enrolledPrograms.map((ep) => {
                    return (
                        <div style={{
                            display: 'flex',
                            flexDirection: "column",
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            padding: '0 24px 16px 24px',
                            width: "full",
                            minWidth: "260px"
                        }}>
                            <h3>{ep.program}</h3>
                            <select
                                style={{minWidth: 260}}
                                className="reportSelect" //The hijack
                                id="program-filter"
                                value={selectedMilestones.get(ep.program)}
                                onChange={(e) =>
                                    changeSelectedMilestone(ep.program, e.target.value)}
                            >
                                {programMilestones.get(ep.program) instanceof Array &&
                                    programMilestones.get(ep.program)?.map(mo => (
                                    <option key={mo} value={mo}>
                                        {mo}
                                    </option>)
                                )}
                            </select>
                        </div>)
                })}
            </div>

            { /* Save button */ }
            <button
                onClick={saveProgramData}
                style={{
                        width: '100%', padding: '10px 12px', borderRadius: 10,
                        background: "black",
                        color: palette.offWhite, fontWeight: 600, cursor: 'pointer',
                }}
            >
                Save Program Progress
            </button>
        </div>
    );
}
