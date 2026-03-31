import styled from "styled-components";
import { Label } from "../modal/clientElement";
import type { Person } from "../person";

const TableContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableRow = styled.div<{ $isHeader?: boolean; $hasActions?: boolean }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.$hasActions
      ? "1fr 1fr 1fr 1fr 1fr 0.7fr 0.5fr"
      : "1fr 1fr 1fr 1fr 1fr 0.7fr"};
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

const ClientName = styled.div`
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #111827;
`;

const TableData = styled.div`
  font-family: "Poppins", sans-serif;
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

const ActionButton = styled.button<{ $clientActive?: boolean }>`
  font-family: "Poppins", sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid
    ${(props) => (props.$clientActive ? "#FCA5A5" : "#6EE7B7")};
  cursor: pointer;
  width: 110px;            
  text-align: center;     
  color: ${(props) =>
    props.$clientActive ? "#991B1B" : "#14532D"};
  background: ${(props) =>
    props.$clientActive ? "#FEE2E2" : "#E1FCEF"};
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$clientActive ? "#FECACA" : "#D1FAE5"};
  }
`;

const EmptyRow = styled.div`
  padding: 40px 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
`;

type Props = {
  people: Person[];
  auth: { user?: { role?: string } }; 
  onClick: (id: string) => void;
  onError: (msg: string) => void;
  onToggleActive: (id: string, active: boolean) => void; 
};

const ClientTable = ({ people, auth, onClick, onError, onToggleActive }: Props) => {
  const isSuperAdmin = auth?.user?.role === "super-admin";

  const nameOf = (p: Person) =>
    `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim();

  const missing = "-".repeat(10);

  const getLocation = function (p: Person) {
    if (p.housing && p.housing.address) {
      const city = p.housing.address.city;
      const province = p.housing.address.province;
      if (city && province) {
        return `${city}, ${province}`;
      } else {
        return city ? city : province ? province : missing;
      }
    }
    return missing;
  };

  return (
    <TableContainer>
      <TableRow $isHeader $hasActions={isSuperAdmin}>
        <Label>Name</Label>
        <Label>Email</Label>
        <Label>Phone</Label>
        <Label>Location</Label>
        <Label>Referral Date</Label>
        <Label>Status</Label>
        {isSuperAdmin && <Label>Action</Label>}
      </TableRow>

      {people.length === 0 ? (
        <EmptyRow>No clients found</EmptyRow>
      ) : (
        people.map((p) => (
        <TableRow
          key={p._id}
          $hasActions={isSuperAdmin}
          onClick={(e) => {
            if (!p._id) {
              return onError("No such client exists");
            }
            if (e.ctrlKey || e.metaKey) {
              window.open(`/client/${p._id}`, "_blank");
            } else {
              onClick(p._id);
            }
          }}
        >
          <ClientName>{nameOf(p)}</ClientName>
          <TableData>{p.email || missing}</TableData>
          <TableData>{p.phone || missing}</TableData>
          <TableData>{getLocation(p)}</TableData>
          <TableData>{p.referral?.referralDate || missing}</TableData>
          <StatusChip active={p.active}>
            {p.active ? "Active" : "InActive"}
          </StatusChip>
          
          {isSuperAdmin && (
            <ActionButton
              $clientActive={p.active}
              onClick={(e) => {
                e.stopPropagation();
                if (!p._id) return onError("No such client exists");
                onToggleActive?.(p._id, !p.active); 
              }}
            >
              {p.active ? "Deactivate" : "Activate"}
            </ActionButton>
          )}
        </TableRow>
      ))
      )}
    </TableContainer>
  );
};

export default ClientTable;