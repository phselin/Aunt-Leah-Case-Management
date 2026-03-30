import styled from "styled-components";
import { Label } from "../client/modal/clientElement";
import { type StaffMember } from "./staff";

const TableContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableRow = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1fr 0.5fr 0.5fr 0.5fr;
  gap: 16px;
  padding: 12px 24px;
  align-items: center;
  justify-items: start;
  background: ${(props) => (props.$isHeader ? "#FDFDFD" : "#FFFFFF")};
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }

  ${(props) =>
    !props.$isHeader &&
    `
    cursor: pointer;
    transition: background 0.2s ease;
    &:hover { background: #F9FAFB; }
  `}
`;

const StaffName = styled.div`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #111827;
`;

const TableData = styled.div`
  font-family: "Inter", sans-serif;
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusChip = styled.span<{ active?: boolean }>`
  background: ${(props) => (props.active ? "#E1FCEF" : "#FEE2E2")};
  color: ${(props) => (props.active ? "#14532D" : "#991B1B")};
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  width: fit-content;
`;

const RoleChip = styled.span<{ $role: string }>`
  background: ${(props) =>
    props.$role === "super-admin"
      ? "#EDE9FE"
      : props.$role === "admin"
        ? "#DBEAFE"
        : "#F3F4F6"};
  color: ${(props) =>
    props.$role === "super-admin"
      ? "#5B21B6"
      : props.$role === "admin"
        ? "#1E40AF"
        : "#374151"};
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  width: fit-content;
`;

const ActionButton = styled.button<{ $staffActive?: boolean }>`
  font-family: "Inter", sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid
    ${(props) => (props.$staffActive ? "#FCA5A5" : "#6EE7B7")};
  cursor: pointer;
  width: 110px;
  text-align: center;
  color: ${(props) => (props.$staffActive ? "#991B1B" : "#14532D")};
  background: ${(props) => (props.$staffActive ? "#FEE2E2" : "#E1FCEF")};
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => (props.$staffActive ? "#FECACA" : "#D1FAE5")};
  }
`;

const EmptyRow = styled.div`
  padding: 40px 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  font-family: "Inter", sans-serif;
`;

type Props = {
  staff: StaffMember[];
  onClick: (id: string) => void;
  onError: (msg: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
};

const StaffTable = ({ staff, onClick, onError, onToggleActive }: Props) => {
  const missing = "-".repeat(10);

  return (
    <TableContainer>
      <TableRow $isHeader>
        <Label>Name</Label>
        <Label>Email</Label>
        <Label>Phone</Label>
        <Label>Role</Label>
        <Label>Status</Label>
        <Label>Action</Label>
      </TableRow>

      {staff.length === 0 ? (
        <EmptyRow>No staff members found</EmptyRow>
      ) : (
        staff.map((s) => (
          <TableRow
            key={s._id}
            onClick={(e) => {
              if (!s._id) return onError("No such staff member exists");
              if (e.ctrlKey || e.metaKey) {
                window.open(`/admin/staff/${s._id}`, "_blank");
              } else {
                onClick(s._id);
              }
            }}
          >
            <StaffName>
              {`${s.firstname ?? ""} ${s.lastname ?? ""}`.trim()}
            </StaffName>
            <TableData>{s.email || missing}</TableData>
            <TableData>{s.phone || missing}</TableData>
            <RoleChip $role={s.role}>{s.role}</RoleChip>
            <StatusChip active={s.active}>
              {s.active ? "Active" : "Inactive"}
            </StatusChip>
            <ActionButton
              $staffActive={s.active}
              onClick={(e) => {
                e.stopPropagation();
                if (!s._id) return onError("No such staff member exists");
                onToggleActive(s._id, !s.active);
              }}
            >
              {s.active ? "Deactivate" : "Activate"}
            </ActionButton>
          </TableRow>
        ))
      )}
    </TableContainer>
  );
};

export default StaffTable;