import type { Person } from "./person";

type Props = {
  people: Person[];
  onEdit: (id: string) => void;
  onClick: (id: string) => void;
  onError: (msg: string) => void;
};

const nameOf = (p: Person) => `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim();

const ClientTable = ({ people, onEdit, onClick, onError }: Props) => {

  return (
    <div className="clientSearchTableCard">
      {people.length === 0 ? (
        <div className="clientSearchEmpty">
          <div className="clientSearchEmptyIcon">👤</div>
          <div className="clientSearchEmptyTitle">No Clients Found</div>
          <div className="clientSearchEmptySub">
            Add your first client to get started
          </div>
        </div>
      ) : (
        <>
          <div className="clientSearchTableHeader">
            <div>Name</div>
            <div>Date of Birth</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Referral Date</div>
            <div>Actions</div>
          </div>

          {people.map((p, idx) => (
            <div className="clientSearchTableRow" key={p._id ?? idx}>
              <div className="clientSearchName" onClick={() => p._id ? onClick(p._id) : onError("No such client exists")}>
                {nameOf(p)}
              </div>
              <div>{p.dob ?? ""}</div>
              <div>{p.email ?? ""}</div>
              <div>{p.phone ?? ""}</div>
              <div>{p.referralDate ?? ""}</div>
              <div className="clientSearchActions">
                <button type="button" onClick={() => p._id ? onEdit(p._id) : onError("No such client exists")}>✏️</button>
                <button type="button">🗑️</button>
              </div>
            </div>
          ))}

          <div className="clientSearchTableFooter">
            Showing {people.length} client{people.length === 1 ? "" : "s"}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientTable;