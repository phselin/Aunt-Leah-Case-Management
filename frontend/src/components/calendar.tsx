// src/components/calendar.tsx
import { Paper, Typography } from "@mui/material";
import { LocalizationProvider, DateCalendar } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import { palette } from "../theme/palette";

type Calendar = {
    value: Dayjs | null;
    onChange: (newValue: Dayjs | null) => void;
};

const COLORS = {
    headerText: palette.deepRed,
    primary: palette.magentaPink,
    secondary: palette.seafoamGreen,
    background: palette.white,
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
                <Typography variant="subtitle2" sx={{ mb: 1, px: 2.5, color: COLORS.headerText, fontWeight: 600, alignSelf: 'flex-start' }}>
                    Select Date
                </Typography>

                <DateCalendar
                    value={value}
                    onChange={onChange}
                    // used AI to help with this (Pranav)
                    sx={{
                        width: '100%',
                        '&.MuiDateCalendar-root': {
                            height: 320,
                            maxHeight: 'none',
                        },
                        '& .MuiDayCalendar-slideTransition': {
                            minHeight: 320,
                        },
                        '& .MuiPickersDay-root.Mui-selected': { backgroundColor: COLORS.primary },

                        '& .MuiDayCalendar-header': {
                            justifyContent: 'space-around',
                        },
                        '& .MuiDayCalendar-weekContainer': {
                            justifyContent: 'space-around',
                            marginBottom: '8px'
                        },
                        '& .MuiPickersDay-root': {
                            width: { xs: '30px', sm: '36px' },
                            height: { xs: '30px', sm: '36px' },
                            fontSize: { xs: '0.8rem', sm: '0.95rem' }
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