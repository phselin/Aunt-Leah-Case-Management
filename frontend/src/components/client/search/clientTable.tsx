import type { Person } from "./person";
import { useNavigate } from "react-router-dom";

type Props = {
  people: Person[];
};

const nameOf = (p: Person) => `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim();

const ClientTable = ({ people }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="clientSearchTableCard">
      {people.length === 0 ? (
        <div className="clientSearchEmpty">
          <div className="clientSearchEmptyIcon">👤</div>
          <div className="clientSearchEmptyTitle">No Clients Found</div>
          <div className="clientSearchEmptySub">Add your first client to get started</div>
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
              <div className="clientSearchName" onClick={() => {if (p._id) navigate(`/client/${p._id}`)}}>{nameOf(p)}</div>
              <div>{p.dob ?? ""}</div>
              <div>{p.email ?? ""}</div>
              <div>{p.phone ?? ""}</div>
              <div>{p.referraldate ?? ""}</div>
              <div className="clientSearchActions">
                <button type="button">✏️</button>
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
