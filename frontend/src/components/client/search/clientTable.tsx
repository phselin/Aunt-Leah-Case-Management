import type { Person } from "../person";
import { formatPhoneNumber } from "react-phone-number-input";

type Props = {
  people: Person[];
  onClick: (id: string) => void;
  onError: (msg: string) => void;
  onDelete: (id: string, name: string) => void;
};

const nameOf = (p: Person) => `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim();

const ClientTable = ({ people, onClick, onError, onDelete }: Props) => {

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
              <div>{p.phone ? formatPhoneNumber(p.phone) : ""}</div>
              <div>{p.referralDate ?? ""}</div>
              <div className="clientSearchActions">
                <button type="button" style={{ fontSize: "16px" }} onClick={() => p._id ? onDelete(p._id, nameOf(p)) : onError("No such client exists")} title="Delete Client">
                  <span style={{ display: "inline-block", width: "20px" }}>🗑️</span>
                </button>
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