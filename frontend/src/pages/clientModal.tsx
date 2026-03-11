import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Tab from "@mui/material/Tab";
import TabList from "@mui/lab/TabList";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import { palette } from "../theme/palette";
import { ClientTitle } from "../components/client/modal/clientElement";
import Details from "../components/client/modal/Details";
import CaseNotes from "../components/client/modal/CaseNotes";
import Progress from "../components/client/modal/Progress";
import type { Person } from "../components/client/person";
import api from "../api"

const SelectedView = {
  Details: "Client Information",
  CaseNotes: "Case Notes",
  Progress: "Progress",
} as const;

type SelectedViewType = (typeof SelectedView)[keyof typeof SelectedView];

const tabs = Object.values(SelectedView);

const ClientModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { setErrMsg, availablePrograms } = useOutletContext<{
    setErrMsg: (msg: string) => void;
    reloadClients: () => void;
    availablePrograms: string[];
  }>();

  const [curView, setCurView] = useState<SelectedViewType>(SelectedView.Details);
  const [clientData, setClientData] = useState<Person | null>(null);

  useEffect(() => {
    if (!id || isNew) return;

    const fetchClient = async () => {
      try {
        const res = await api.get(`/people/${id}`);
        setClientData(res.data);
      } catch {
        setErrMsg("Unable to find client details");
        navigate("/client");
      }
    };

    fetchClient();
  }, [id, isNew, navigate, setErrMsg]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurView(newValue as SelectedViewType);
  };

  const clientName = clientData
    ? `${clientData.firstname ?? ""} ${clientData.lastname ?? ""}`.trim()
    : "";
  const title = isNew ? "Add New Client" : clientName || "Client";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 80px)",
        backgroundColor: palette.offWhite,
      }}
    >
      <div style={{ padding: "16px 32px 0" }}>
        <button
          onClick={() => navigate("/client")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: `1.5px solid ${palette.deepRed}`,
            borderRadius: 8,
            cursor: "pointer",
            color: palette.deepRed,
            fontSize: 13,
            fontWeight: 500,
            padding: "6px 12px",
          }}
        >
          ← Back to Clients
        </button>
      </div>

      <div style={{ padding: "8px 32px 0" }}>
        <ClientTitle style={{ fontSize: 28, fontWeight: 700 }}>{title}</ClientTitle>
      </div>

      <TabContext value={curView}>
        {!isNew && (
          <div style={{ padding: "0 32px", borderBottom: "1px solid #e8e8e8" }}>
            <TabList
              onChange={handleTabChange}
              sx={{
                minHeight: 36,
                "& .MuiTabs-indicator": {
                  backgroundColor: palette.deepRed,
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  minHeight: 36,
                  padding: "6px 20px",
                  color: "#5a5a5a",
                  "&.Mui-selected": {
                    color: palette.deepRed,
                  },
                },
              }}
            >
              {tabs.map((tab) => (
                <Tab key={tab} label={tab} value={tab} />
              ))}
            </TabList>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "0 32px" }}>
          <TabPanel value={SelectedView.Details} sx={{ p: 0, pt: 2 }}>
            <Details
              id={id}
              isNew={isNew}
              initialData={clientData}
              availablePrograms={availablePrograms}
            />
          </TabPanel>

          {id && !isNew && (
            <>
              <TabPanel value={SelectedView.CaseNotes} sx={{ p: 0, pt: 2 }}>
                <CaseNotes personId={id} />
              </TabPanel>

              <TabPanel value={SelectedView.Progress} sx={{ p: 0, pt: 2 }}>
                <Progress personId={id} />
              </TabPanel>
            </>
          )}
        </div>
      </TabContext>
    </div>
  );
};

export default ClientModal;