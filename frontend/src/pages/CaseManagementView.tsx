import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom'
import { Dialog } from '@mui/material'
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs'
import CalendarComponent from "../components/calendar/calendarComponent";
import { palette } from "../theme/palette";

type CaseNote = {
  content: string
  date: string
  goalid: string
}

export default function CaseManagementView() {
  const [errMsg, setErrMsg] = useState('')
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([])
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs()) 
  const [isEditing, setIsEditing] = useState(false)
  const [noteText, setNoteText] = useState('')

  const { id } = useParams()
  const navigate = useNavigate()
  const selectedNote = caseNotes.find(note => note.date === selectedDate?.format('YYYY-MM-DD'))

  const handleSave = async () => {
  try {
    const payload = {
      personid: id,
      date: selectedDate?.format('YYYY-MM-DD') ?? "",
      content: noteText
    }
    await axios.post('http://localhost:8000/casenotes', payload, { withCredentials: true })
    setCaseNotes(prev => {
      const dateStr = selectedDate?.format('YYYY-MM-DD')
      const exists = prev.find(n => n.date === dateStr)
      if (exists) {
        return prev.map(n => n.date === dateStr ? { ...n, content: noteText } : n)
      }
      return [...prev, { ...payload, goalid: '' }]
    })
    setIsEditing(false)
  } catch (err) {
    setErrMsg(`Failed to save note: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}
  
  useEffect(() => {
  const loadClient = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/casenotes?person=${id}`, { withCredentials: true })
      setCaseNotes(res.data)
    } catch (err) {
      setErrMsg(`Unable to find client details: ${err instanceof Error ? err.message : 'Unknown error'}`)
      navigate("/client")
    }
  }
  loadClient()
}, [id, navigate])

const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate)
const [prevCaseNotes, setPrevCaseNotes] = useState(caseNotes)

if (prevSelectedDate !== selectedDate || prevCaseNotes !== caseNotes) {
  setPrevSelectedDate(selectedDate)
  setPrevCaseNotes(caseNotes)
  setNoteText(selectedNote?.content || '')
  setIsEditing(false)
}

  const calendarSx = {
    '& .MuiPickersDay-root.Mui-selected': {
      backgroundColor: palette.seafoamGreen,
      '&:hover': { backgroundColor: palette.forestGreen },
    },
    '& .MuiPickersDay-root:focus.Mui-selected': {
      backgroundColor: palette.seafoamGreen,
    },
  }

  return (
    <Dialog
      open
      onClose={() => navigate('/client')}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px', padding: 0, overflow: 'hidden' } }}
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

      <div style={{ display: 'flex', gap: 16, padding: '16px 24px 24px 24px', minHeight: 380 }}>
        <div style={{ flexShrink: 0 }}>
          <CalendarComponent value={selectedDate} onChange={setSelectedDate} sx={calendarSx} />
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid #ececec', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#666' }}>
            {selectedDate?.format('MMMM D, YYYY')}
          </p>

          {isEditing ? (
            <>
              <textarea
                rows={10}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter case note..."
                style={{
                  flex: 1, padding: '10px 12px', border: '1px solid #ececec', borderRadius: 8,
                  outline: 'none', resize: 'vertical', fontSize: 14, fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: `1px solid ${palette.tangerineOrange}`,
                    background: '#fff', color: palette.tangerineOrange, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: `1px solid ${palette.seafoamGreen}`,
                    background: palette.seafoamGreen, color: '#fff', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ flex: 1, margin: 0, fontSize: 14, color: selectedNote ? '#111' : '#999' }}>
                {selectedNote ? selectedNote.content : 'No note for this date'}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${palette.seafoamGreen}`, background: '#fff',
                  color: palette.seafoamGreen, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {selectedNote ? 'Edit Note' : 'Add Note'}
              </button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}
