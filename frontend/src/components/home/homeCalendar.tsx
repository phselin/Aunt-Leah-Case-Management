import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarCard } from "./homeElement"; 

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type HomeCalendarProps = {
  value: Value;
  onChange: (value: Value) => void;
};

const HomeCalendar = ({ value, onChange }: HomeCalendarProps) => {
  return (
    <CalendarCard>
      <Calendar onChange={onChange} value={value} />
    </CalendarCard>
  );
};

export default HomeCalendar;