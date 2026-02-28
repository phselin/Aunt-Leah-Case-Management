import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom'
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs'
import CalendarComponent from "../components/calendar/calendarComponent";
import {
  Box, TextField, Button, Typography
} from '@mui/material';

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
    setErrMsg('Failed to save note')
  }
}
  
  useEffect(() => {
  const loadClient = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/casenotes?person=${id}`, { withCredentials: true })
      setCaseNotes(res.data)
    } catch (err) {
      setErrMsg("Unable to find client details")
      navigate("/client")
    }
  }
  loadClient()
}, [id])

useEffect(() => {
  setNoteText(selectedNote?.content || '')
  setIsEditing(false)
}, [selectedDate, caseNotes])

  return (
    <Dialog open onClose={() => navigate('/client')} maxWidth="md" fullWidth>
      <DialogTitle>
        Case Notes
        <IconButton onClick={() => navigate('/client')} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 2, height: 400, overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0 }}>
          <CalendarComponent value={selectedDate} onChange={setSelectedDate} />
        </Box>
        <Box sx={{ flex: 1, borderLeft: '1px solid #e0e0e0', pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            {selectedDate?.format('MMMM D, YYYY')}
          </Typography>

          {isEditing ? (
            <>
              <TextField
                multiline
                rows={8}
                fullWidth
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter case note..."
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSave}>Save</Button>
                <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancel</Button>
              </Box>
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1 }}>
                {selectedNote ? selectedNote.content : 'No note for this date'}
              </Typography>
              <Button variant="outlined" onClick={() => setIsEditing(true)}>
                {selectedNote ? 'Edit' : 'Add Note'}
              </Button>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
