import styled from "styled-components";

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

  /* make react-calendar fit nicer */
  .react-calendar {
    border: none;
    width: 100%;
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
  border: 1px solid #3aa36f;
  background: #ffffff;
  color: #3aa36f;
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

  &:hover {
    background: #f6f6f6;
  }
`;

