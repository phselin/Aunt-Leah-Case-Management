import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs'
import type { SxProps, Theme } from '@mui/material/styles'

type Props = {
  value: Dayjs | null
  onChange: (newVal: Dayjs | null) => void
  sx?: SxProps<Theme>
}

export default function CalendarComponent({ value, onChange, sx }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar value={value} onChange={onChange} sx={sx} />
    </LocalizationProvider>
  )
}