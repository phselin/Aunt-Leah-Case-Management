// src/components/calendar.tsx
import { Paper, Typography } from "@mui/material";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

type Calendar = {
    value: Dayjs | null;
    onChange: (newValue: Dayjs | null) => void;
};

const COLORS = {
    headerText: '#5d3b4b',
    primary: '#b06a72',
    secondary: '#c2d5c6',
    background: '#f8f9fa'
};

const CalendarComponent = ({ value, onChange }: Calendar) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Paper elevation={0} sx={{
                p: 2,
                borderRadius: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
            }}>
                <Typography variant="subtitle2" sx={{ mb: 2, px: 2, color: COLORS.headerText, fontWeight: 600, alignSelf: 'flex-start' }}>
                    Select Date
                </Typography>

                <DateCalendar
                    value={value}
                    onChange={onChange}
                    // used AI to help with this (Pranav)
                    sx={{
                        width: '100%',
                        height: 'auto',
                        '& .MuiPickersDay-root.Mui-selected': { backgroundColor: COLORS.primary },

                        '& .MuiDayCalendar-header': {
                            justifyContent: 'space-around',
                        },
                        '& .MuiDayCalendar-weekContainer': {
                            justifyContent: 'space-around',
                            marginBottom: '8px'
                        },
                        '& .MuiPickersDay-root': {
                            width: { xs: '36px', sm: '45px' },
                            height: { xs: '36px', sm: '45px' },
                            fontSize: { xs: '0.9rem', sm: '1.05rem' }
                        },
                        '& .MuiPickersCalendarHeader-root': {
                            paddingLeft: '24px',
                            paddingRight: '12px'
                        },
                    }}
                />
            </Paper>
        </LocalizationProvider>
    );
};

export default CalendarComponent;