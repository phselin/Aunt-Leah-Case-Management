import React from "react";
import type { Person } from "./person";

type Props = {
  people: Person[];
};

const nameOf = (p: Person) => `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim();

const ClientTable = ({ people }: Props) => {
  return (
    <div className="clientTableCard">
      {people.length === 0 ? (
        <div className="clientEmpty">
          <div className="clientEmptyIcon">👤</div>
          <div className="clientEmptyTitle">No Clients Found</div>
          <div className="clientEmptySub">Add your first client to get started</div>
        </div>
      ) : (
        <>
          <div className="clientTableHeader">
            <div>Name</div>
            <div>Date of Birth</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Referral Date</div>
            <div>Actions</div>
          </div>

          {people.map((p, idx) => (
            <div className="clientTableRow" key={p._id ?? idx}>
              <div className="clientName">{nameOf(p)}</div>
              <div>{p.dob ?? ""}</div>
              <div>{p.email ?? ""}</div>
              <div>{p.phone ?? ""}</div>
              <div>{p.referraldate ?? ""}</div>
              <div className="clientActions">
                <button type="button">✏️</button>
                <button type="button">🗑️</button>
              </div>
            </div>
          ))}

          <div className="clientTableFooter">
            Showing {people.length} client{people.length === 1 ? "" : "s"}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientTable;
