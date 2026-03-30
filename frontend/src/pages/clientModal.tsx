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
import type { IntakeFormConfig, Person } from "../components/client/person";
import { ChevronLeft } from "lucide-react";
import api from "../api";
import axios from "axios";

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

  const { setErrMsg, formConfig } = useOutletContext<{
    setErrMsg: (msg: string) => void;
    formConfig: IntakeFormConfig | null;
  }>();

  const [curView, setCurView] = useState<SelectedViewType>(
    SelectedView.Details,
  );
  const [clientData, setClientData] = useState<Person | null>(null);

  useEffect(() => {
    if (!id || isNew) return;

    const fetchClient = async () => {
      try {
        const res = await api.get(`/people/${id}`);
        setClientData(res.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setErrMsg(
            "You do not have permission to view this client's information",
          );
        } else {
          setErrMsg("Unable to find client details");
        }
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
        backgroundColor: "#f9fafb",
      }}
    >
      <div style={{ padding: "16px 32px 0" }}>
        <button
          onClick={() => navigate("/client")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280", // Default muted grey
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 16,
            padding: 0, // No extra box around the text
            transition: "color 0.2s ease",
            marginLeft:"20px"
          }}
          onMouseEnter={(e) => {
            // Only change the text/icon color to the brand red
            e.currentTarget.style.color = "#D16B7B";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6B7280";
          }}
        >
          <ChevronLeft size={18} /> Back to Clients
        </button>
      </div>

      <div style={{ padding: "8px 60px 0" }}>
        <ClientTitle style={{ fontSize: 28, fontWeight: 700 }}>
          {title}
        </ClientTitle>
      </div>

      <TabContext value={curView}>
        {!isNew && (
          <div style={{ padding: "0 60px", borderBottom: "1px solid #e8e8e8" }}>
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
                  "&:first-of-type": {
                  paddingLeft: 0,     // Perfectly aligns the first tab text to the left edge
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
          <TabPanel value={SelectedView.Details} sx={{ p: 0 }}>
            <Details
              id={id}
              isNew={isNew}
              initialData={clientData}
              formConfig={formConfig}
              onSave={(updated: Person) => setClientData(updated)}
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
