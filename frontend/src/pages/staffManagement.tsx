import axios from "axios";
import { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api";
import { ErrorBox, PrimaryBtn, SuccessBox } from "../components/client/modal/clientElement";
import { type StaffMember } from "../components/staff/staff";
import StaffModal from "../components/staff/staffModal";
import StaffSearchBar from "../components/staff/staffSearchBar";
import StaffTable from "../components/staff/staffTable";
import ClientFilter from "../pages/clientFilter";

const HeaderRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
`;

const TableSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const StaffManagement = () => {
  const [query, setQuery] = useState("");
  const [debounceQuery, setDebounceQuery] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("")
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounceQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (errMsg) {
      const timer = setTimeout(() => setErrMsg(""), 3000);
      return () => clearTimeout(timer);
    }
    if (successMsg) {
        const timer = setTimeout(() => setSuccessMsg(""), 3000);
        return () => clearTimeout(timer)
    }
  }, [errMsg, successMsg]);

  useEffect(() => {
    const loadStaff = async () => {
      const q = debounceQuery.trim().toLowerCase();
      try {
        const res = await api.get(`/staff${q ? `?staff=${q}` : ""}`);
        setStaff(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setErrMsg(err.response.data?.detail || "Failed to load staff");
        } else {
          setErrMsg("Unable to connect to server");
        }
      }
    };
    loadStaff();
  }, [debounceQuery]);

  useEffect(() => {
  const loadStaff = async () => {
    const q = debounceQuery.trim().toLowerCase();

    try {
      const params = new URLSearchParams();

      if (q) params.append("staff", q);

      selectedPrograms.forEach((program) => {
        params.append("program", program);
      });

      const queryString = params.toString();
      const res = await api.get(`/staff${queryString ? `?${queryString}` : ""}`);
      setStaff(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setErrMsg(err.response.data?.detail || "Failed to load staff");
      } else {
        setErrMsg("Unable to connect to server");
      }
    }
  };

  loadStaff();
}, [debounceQuery, selectedPrograms]);

  useEffect(() => {
  const loadPrograms = async () => {
    try {
      const res = await api.get("/programs/names");
      setAvailablePrograms(Array.isArray(res.data) ? res.data : []);
    } catch {
      setErrMsg("Failed to load programs");
    }
  };

  loadPrograms();
  }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await api.patch(`/staff/${id}/active`, { active });
      setStaff((prev) =>
        prev.map((s) => (s._id === id ? { ...s, active } : s))
      );
    } catch {
      setErrMsg("Failed to update status");
    }
  };

  const handleRowClick = async (id: string) => {
    try {
      const res = await api.get(`/staff/${id}`);
      setSelectedStaff(res.data);
      setIsNew(false);
      setModalOpen(true);
    } catch {
      setErrMsg("Failed to load staff member details");
    }
  };

  const handleAddNew = () => {
    setSelectedStaff(null);
    setIsNew(true);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedStaff(null);
    setIsNew(false);
  };

  const handleSave = (updated: StaffMember) => {
    if (isNew) {
      setStaff((prev) => [updated, ...prev]);
      setSuccessMsg(`${updated.firstname} ${updated.lastname} added successfully!`)
    } else {
      setStaff((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s))
      );
      setSuccessMsg(`${updated.firstname} ${updated.lastname} updated successfully!`)
    }
    handleModalClose();
  };

  const filteredStaff = staff.filter((member) => {
  if (selectedPrograms.length === 0) return true;

  if (!member.programs || !Array.isArray(member.programs)) return false;

    return member.programs.some((program: any) => {
      if (typeof program === "string") {
        return selectedPrograms.includes(program);
      }

      if (typeof program === "object" && program !== null) {
        return selectedPrograms.includes(program.name);
      }

      return false;
    });
  });

  return (
    <>
      <HeaderRow>
        <PrimaryBtn onClick={handleAddNew}>+ Add Staff</PrimaryBtn>
      </HeaderRow>

      <TableSection>
        {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
        {successMsg && <SuccessBox>{successMsg}</SuccessBox>}

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <StaffSearchBar query={query} setQuery={setQuery} />
          </div>

          <ClientFilter
            selectedPrograms={selectedPrograms}
            setSelectedPrograms={setSelectedPrograms}
            availablePrograms={availablePrograms}
          />
        </div>

        <StaffTable
          staff={filteredStaff}
          onClick={handleRowClick}
          onError={(msg) => setErrMsg(msg)}
          onToggleActive={handleToggleActive}
        />
      </TableSection>

      <StaffModal
        open={modalOpen}
        isNew={isNew}
        staffData={selectedStaff}
        onClose={handleModalClose}
        onSave={handleSave}
        onError={(msg) => setErrMsg(msg)}
      />
    </>
  );
};

export default StaffManagement;