import styled from "styled-components";

export const AddClientCard = styled.div`
  width: 100%;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

export const AddClientHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

export const AddClientTitleWrap = styled.div`
  display: grid;
  gap: 4px;
`;

export const AddClientTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111;
`;

export const AddClientSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  color: #666;
`;

export const CloseBtn = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  color: #666;
  font-size: 14px;

  &:hover {
    background: #f6f6f6;
    color: #111;
  }
`;

export const ErrorBox = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ffd1d1;
  background: #fff3f3;
  color: #b42318;
  font-size: 13px;
`;

export const AddClientGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const FullRow = styled.div`
  grid-column: 1 / -1;
`;

export const FormRow = styled.div`
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
  font-size: 14px;

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
  min-height: 80px;
  font-size: 14px;

  &:focus {
    border-color: #bdbdbd;
  }
`;

export const Hint = styled.div`
  font-size: 11px;
  color: #888;
`;

export const FormActions = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

export const SecondaryBtn = styled.button`
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #d92d20;
  background: #fff;
  color: #d92d20;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(217, 45, 32, 0.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const PrimaryBtn = styled.button`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #3aa36f;
  background: #3aa36f;
  color: #fff;
  cursor: pointer;
  font-weight: 700;

  &:hover {
    background: rgba(58, 163, 111, 0.92);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;