import styled from "styled-components";
import type { Person } from "../person";
import { Label } from "../modal/clientElement";

const TableContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableRow = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 0.5fr;
  gap: 16px;
  padding: 12px 24px;
  align-items: center;
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

type Props = {
  people: Person[];
  onClick: (id: string) => void;
  onError: (msg: string) => void;
};

const ClientTable = ({ people, onClick, onError }: Props) => {
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
      <TableRow $isHeader>
        <Label>Name</Label>
        <Label>Email</Label>
        <Label>Phone</Label>
        <Label>Location</Label>
        <Label>Referral Date</Label>
        <Label>Status</Label>
      </TableRow>

      {people.map((p) => (
        <TableRow
          key={p._id}
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
        </TableRow>
      ))}
    </TableContainer>
  );
};

export default ClientTable;
