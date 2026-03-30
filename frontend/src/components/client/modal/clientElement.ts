import styled from "styled-components";
import { palette } from "../../../theme/palette";


const colors = {
  background: "#F9FAFB", // Light gray for the page base
  white: "#FFFFFF",
  border: "#E5E7EB", 
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  primaryGreen: "#10B981",
  primaryGreenHover: "#059669",
};

export const ClientTitle = styled.h2`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: ${colors.textPrimary};
  letter-spacing: -0.025em;
`;

export const Label = styled.label`
  font-size: 13px;
  color: ${colors.textSecondary};
  font-weight: 600;
`;

const inputFocusRing = `
  border-color: ${colors.primaryGreen};
  background: ${colors.white};
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
`;

export const Input = styled.input`
  width: 100%;
  height: 40px; /* Tighter height than before */
  padding: 0 12px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  background: ${colors.white};
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    ${inputFocusRing}
  }
`;

export const PrimaryBtn = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background: ${colors.primaryGreen};
  color: white;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
  &:hover { background: ${colors.primaryGreenHover}; }
`;

export const SecondaryBtn = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid ${colors.border};
  background: white;
  color: ${colors.textPrimary};
  font-weight: 600;
  font-size: 14px;
  &:hover { background: #F9FAFB; }
`;

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

export const SuccessBox = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid green;
  background: ${palette.white};
  color: green;
  font-size: 13px;
`;

export const ErrorBox = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid red;
  background: ${palette.white};
  color: red;
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

export const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  padding: 0 32px 0 12px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  background-color: ${colors.white};
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  appearance: none;
  -webkit-appearance: none;
  transition: all 0.2s;

  &:focus {
    ${inputFocusRing}
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  font-size: 14px;
  font-family: inherit;
  background: ${colors.white};
  transition: all 0.2s;

  &:focus {
    ${inputFocusRing}
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