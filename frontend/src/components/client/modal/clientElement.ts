import styled from "styled-components";
import { palette } from "../../../theme/palette";

export const ClientCard = styled.div`
  width: 100%;
`;

export const ClientHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

export const ClientTitleWrap = styled.div`
  display: grid;
  gap: 4px;
`;

export const ClientTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111;
`;

export const ClientSubtitle = styled.p`
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
  border: 1px solid ${palette.tangerineOrange};
  background: ${palette.white};
  color: ${palette.tangerineOrange};
  font-size: 13px;
`;

export const ClientGrid = styled.div`
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
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ececec;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  background: #fff;

  &:focus {
    border-color: #bdbdbd;
  }
`;

export const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  padding: 0 32px 0 12px;
  border: 1px solid #ececec;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  background: #fff
    url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  appearance: none;
  -webkit-appearance: none;

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
  border: 1px solid ${palette.tangerineOrange};
  background: #fff;
  color: ${palette.tangerineOrange};
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
  border: 1px solid ${palette.seafoamGreen};
  background: ${palette.seafoamGreen};
  color: #fff;
  cursor: pointer;
  font-weight: 700;

  &:hover {
    background: rgba(${palette.forestGreen}, 0.92);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;