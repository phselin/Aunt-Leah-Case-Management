import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import styled from "styled-components";
import api from "../api";
import { ErrorBox } from "../components/client/modal/clientElement";
import type { Person } from "../components/client/person";
import ClientHeader from "../components/client/search/clientHeader";
import ClientSearchBar from "../components/client/search/clientSearchBar";
import ClientTable from "../components/client/search/clientTable";
import AuthContext from "../context/AuthProvider";
import ClientFilter from "./clientFilter";

const PageContainer = styled.div`
  background-color: #f9fafb;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  font-family: "Poppins", sans-serif;
`;

const ContentArea = styled.div`
  width: 100%;
  margin: 0 auto;
  /* 0 bottom padding to keep footer tight to table */
  padding: 32px 4rem 0 4rem;
  display: flex;
  flex-direction: column;
  flex: 1; /* Ensures this area grows to fill space */

  @media screen and (max-width: 850px) {
    padding: 24px 1.5rem 0;
  }
`;

const TableSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
  margin-bottom: 0px;
`;

function filterByPrograms(people: Person[], selectedPrograms: string[]) {
  if (selectedPrograms.length === 0) return people;

  return people.filter((person) =>
    selectedPrograms.some((program) => person.programs?.includes(program)),
  );
}

const Client = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const { id } = useParams();
  const [debounceQuery, setDebounceQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  type FormConfig = {
    programs: string[];
  };

  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);

  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

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
    const fetchFormConfig = async () => {
      try {
        setFormConfig((await api.get("/people/intake")).data);
      } catch {
        setErrMsg("Failed to load form config");
      }
    };
    fetchFormConfig();
  }, [id]);

  useEffect(() => {
    const loadPeople = async () => {
      const q = debounceQuery.trim().toLowerCase();
      try {
        const res = await api.get(`/people${q ? `?person=${q}` : ""}`);
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

    if (!id) {
      loadPeople();
    }
  }, [debounceQuery, id]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get("/programs/names");
        setAvailablePrograms(res.data);
      } catch {
        setErrMsg("Failed to load programs");
      }
    };

    fetchPrograms();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setErrMsg("");

    try {
      const res = await api.get("/people/export", {
        params: {
          programs: selectedPrograms.join(","),
          search: debounceQuery,
        },
        withCredentials: true,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "clients.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setErrMsg("You do not have permission to export clients");
      } else {
        setErrMsg("Failed to export clients. Try again after some time.");
      }
    } finally {
      setExporting(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await api.patch(`/people/${id}/active`, { active: active });
      setPeople((prev) =>
        prev.map((p) => (p._id === id ? { ...p, active: active } : p)),
      );
    } catch {
      setErrMsg("Failed to update status");
    }
  };

  // return (
  //   <div className="clientPage">
  //     {errMsg && (
  //       <div className="clientErrorBox" ref={errRef}>
  //         {errMsg}
  //       </div>
  //     )}
  //     {id ? (
  //       <Outlet context={{ setErrMsg, formConfig }} />
  //     ) : (
  //       <>
  //         <ClientHeader onAdd={() => { navigate("/client/new") }} onExport={handleExport} exporting={exporting} />
  //         <ClientSearchBar query={query} setQuery={setQuery} />
  //         <ClientTable
  //           people={people}
  //           onClick={(pid) => navigate(`/client/${pid}`)}
  //           onError={(msg: string) => setErrMsg(msg)}
  //           onDelete={(pid, pname) => handleDelete(pid, pname)} />
  //       </>
  //     )}

  //   </div>
  // );

  if (id) {
    return (
      <PageContainer>
        <Outlet context={{ setErrMsg, formConfig }} />
      </PageContainer>
    );
  }
  const filteredPeople = filterByPrograms(people, selectedPrograms);
  console.log(people, filteredPeople);

  // If we are on the main list page

  return (
    <PageContainer>
      <ContentArea>
        <ClientHeader
          onAdd={() => {
            navigate("/client/new");
          }}
          onExport={handleExport}
          exporting={exporting}
        />

        <TableSection>
          {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div style={{ flex: 1 }}>
              <ClientSearchBar query={query} setQuery={setQuery} />
            </div>

            <ClientFilter
              selectedPrograms={selectedPrograms}
              setSelectedPrograms={setSelectedPrograms}
              availablePrograms={availablePrograms}
            />
          </div>
          <ClientTable
            people={filteredPeople}
            auth={auth}
            onClick={(pid) => navigate(`/client/${pid}`)}
            onError={(msg) => setErrMsg(msg)}
            onToggleActive={(pid, active) => handleToggleActive(pid, active)}
          />
        </TableSection>
      </ContentArea>
    </PageContainer>
  );
};

export default Client;
