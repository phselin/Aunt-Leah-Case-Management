import { useEffect, useRef, useState } from "react";
import axios from "axios";

type Person = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  email?: string;
  phone?: string;
  referraldate?: string | null;
};

// TODO debouncing query because storing all clients inside array is inefficient

const Client = () => {
  const errRef = useRef<HTMLParagraphElement>(null);

  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const res = await axios.get("http://localhost:8000/people", {
          withCredentials: true,
        });
        const data = Array.isArray(res.data) ? res.data : res.data.people;
        const arr = data ?? [];
        setAllPeople(arr);
        setPeople(arr.slice(-20).reverse()); // newest 20 
        setErrMsg("");
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setErrMsg(err.response.data?.detail || "Failed to load people");
        } else {
          setErrMsg("Unable to connect to server");
        }
      }
    };

    loadPeople();
  }, []);

  const q = query.trim().toLowerCase();

  const visiblePeople = q
    ? allPeople.filter((p) => {
        const name = `${p.firstname ?? ""} ${p.lastname ?? ""}`
          .replace(/\s+/g, " ")
          .toLowerCase();

        return name.includes(q);
      })
    : people; 



  const nameOf = (p: Person) => `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim();


  return (
    <div className="clientPage">
      <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">
        {errMsg}
      </p>

      <div className="clientHeaderRow">
        <div className="clientTitle">Client Management</div>
        <button type="button" className="addClientBtn">+ Add Client</button>
      </div>

      <div className="clientSearchBar">
        <span className="searchIcon">🔍</span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="clientTableCard">
        {visiblePeople.length === 0 ? (
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

            {visiblePeople.map((p, idx) => (
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
              Showing {visiblePeople.length} client{visiblePeople.length === 1 ? "" : "s"}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Client;
