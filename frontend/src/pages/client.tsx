import { useEffect, useRef, useState } from "react";
import axios from "axios";

import ClientError from "../components/client/clientError";
import ClientHeader from "../components/client/clientHeader";
import ClientSearchBar from "../components/client/clientSearchBar";
import ClientTable from "../components/client/clientTable";
import type { Person } from "../components/client/person";

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

  return (
    <div className="clientPage">
      <ClientError errRef={errRef} errMsg={errMsg} />
      <ClientHeader />
      <ClientSearchBar query={query} setQuery={setQuery} />
      <ClientTable people={visiblePeople} />
    </div>
  );
};

export default Client;
