import { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import axios from "axios";

import ClientHeader from "../components/client/search/clientHeader";
import ClientSearchBar from "../components/client/search/clientSearchBar";
import ClientTable from "../components/client/search/clientTable";
import type { Person } from "../components/client/search/person";

const Client = () => {
  const navigate = useNavigate();
  const errRef = useRef<HTMLParagraphElement>(null);

  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);
  const reloadClients = () => setReloadFlag((x) => x + 1);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceQuery(query);
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (errMsg) {
      const timer = setTimeout(() => {
        setErrMsg("");
      }, 2000);

      return () => clearTimeout(timer); 
    }
  }, [errMsg]);

  useEffect(() => {
    const loadPeople = async () => {
      const q = debounceQuery.trim().toLowerCase();
      try {
        const res = await axios.get(`http://localhost:8000/people${q ? `?person=${q}` : ""}`, {
          withCredentials: true,
        });
        const data = Array.isArray(res.data) ? res.data : res.data.people;
        const arr = data ?? [];
        setPeople(arr);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setErrMsg(err.response.data?.detail || "Failed to load people");
        } else {
          setErrMsg("Unable to connect to server");
        }
      }
    };

    loadPeople();
  }, [debounceQuery, reloadFlag]);

  const handleExport = async () => {
    setExporting(true)
    setErrMsg("")
    
    try {
      const res = await axios.get("http://localhost:8000/people/export", {
        withCredentials: true, 
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      console.log(res.headers["Content-Disposition"]);
      link.href = url;
      link.download = "clients.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrMsg("Failed to export clients. Try again after some time.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="clientPage">
      {errMsg && (
        <div className="clientErrorBox" ref={errRef}>
          {errMsg}
        </div>
      )}
      <ClientHeader onAdd={() => {navigate("/client/new")}} onExport={handleExport} exporting={exporting}/>
      <ClientSearchBar query={query} setQuery={setQuery} />
      <ClientTable 
        people={people}
        onEdit={(pid) => navigate(`/client/${pid}`)} 
        onClick={(pid) => navigate(`/client/${pid}/casenotes`)} 
        onError={(msg: string) => setErrMsg(msg)}/>
      <Outlet context={{ setErrMsg, reloadClients }} />
    </div>
  );
};

export default Client;
