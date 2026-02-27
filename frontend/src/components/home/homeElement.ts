import styled from "styled-components";
import { palette } from "../../theme/palette";

export const Row = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

export const Card = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
`;

export const CalendarCard = styled(Card)`
  min-width: 320px;

  .react-calendar {
    border: none;
    width: 100%;
    color: #111; /* <-- key line */
  }

  /* Most of the day numbers are buttons */
  .react-calendar button {
    color: #111;
  }

  /* Weekday labels (MON, TUE, etc.) */
  .react-calendar__month-view__weekdays {
    color: #111;
  }

  /* Optional: dim “neighboring month” days */
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #999;
  }

  /* Optional: disabled days */
  .react-calendar__tile:disabled {
    color: #bbb;
  }
`;

export const ItineraryCard = styled(Card)`
  min-width: 360px;
  flex: 1;
`;

export const ItineraryTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
`;

export const ItineraryDate = styled.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
`;

export const AddEventBtn = styled.button`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${palette.seafoamGreen};
  background: #ffffff;
  color: ${palette.seafoamGreen};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(58, 163, 111, 0.08);
  }
`;

export const EventList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
  display: grid;
  gap: 12px;
`;

export const EventItemCard = styled.li`
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
`;

export const EventTitle = styled.strong`
  display: block;
  font-size: 14px;
`;

export const EventTime = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #c04b5a;
  font-weight: 600;
`;

export const EventNotes = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #666;
`;


export const EventActions = styled.div`
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: #888;
`;

export const ActionBtn = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: inherit;

  &:hover {
    color: #333;
  }
`;


export const FormRow = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12px;
  color: #666;
  font-weight: 600;
`;

export const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ececec;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #bdbdbd;
  }
`;


export const TimePickerWrapper = styled.div`
  position: relative;

  & > input {
    width: 100%;
    box-sizing: border-box;
  }
`;

export const TimeDropdown = styled.ul`
  position: absolute;
  z-index: 10;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

export const TimeOption = styled.li<{ $highlighted?: boolean }>`
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  background: ${({ $highlighted }) => ($highlighted ? "rgba(58, 163, 111, 0.1)" : "transparent")};

  &:hover {
    background: rgba(58, 163, 111, 0.1);
  }
`;

export const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #ececec;
  border-radius: 8px;
  outline: none;
  resize: vertical;
  min-height: 70px;

  &:focus {
    border-color: #bdbdbd;
  }
`;

export const FormActions = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

export const SecondaryBtn = styled.button`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ececec;
  background: #fff;
  cursor: pointer;
  color: #c04b5a;
  &:hover {
    background: #f6f6f6;
  }
`;

