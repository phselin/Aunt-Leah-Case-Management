import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";
import { useState } from "react";
import styled from "styled-components";
import { palette } from "../theme/palette";
import ProgramManagement from "./programManagement";
import StaffManagement from "./staffManagement";
import AuditLog from "./auditLog";

const AdminViews = {
  Staff: "Staff Management",
  Programs: "Program Management",
  Audit: "Audit Log",
} as const;

type AdminViewType = (typeof AdminViews)[keyof typeof AdminViews];

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
  padding: 32px 4rem 0 4rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  @media screen and (max-width: 850px) {
    padding: 24px 1.5rem 0;
  }
`;

const PageTitle = styled.h1`
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 32px;
  color: #111827;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 15px;
  color: #6b7280;
  margin: 8px 0 0;
  letter-spacing: 0.01em;
  line-height: 1.5;
`;

const Admin = () => {
  const [curView, setCurView] = useState<AdminViewType>(AdminViews.Staff);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurView(newValue as AdminViewType);
  };

  return (
    <PageContainer>
      <ContentArea>
        <PageTitle>Admin</PageTitle>
        <Subtitle>Manage staff members and program configuration</Subtitle>

        <TabContext value={curView}>
          <div
            style={{
              marginTop: 24,
              borderBottom: "1px solid #e8e8e8",
            }}
          >
            <TabList
              onChange={handleTabChange}
              sx={{
                fontFamily: '"Poppins", sans-serif',
                minHeight: 36,
                "& .MuiTabs-indicator": {
                  backgroundColor: palette.deepRed,
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
                "& .MuiTab-root": {
                  fontFamily: '"Poppins", sans-serif',
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
              <Tab label={AdminViews.Staff} value={AdminViews.Staff} />
              <Tab label={AdminViews.Programs} value={AdminViews.Programs} />
              <Tab label={AdminViews.Audit} value={AdminViews.Audit} />
            </TabList>
          </div>

          <TabPanel value={AdminViews.Staff} sx={{ p: 0, pt: 3 }}>
            <StaffManagement />
          </TabPanel>

          <TabPanel value={AdminViews.Programs} sx={{ p: 0, pt: 3 }}>
            <ProgramManagement />
          </TabPanel>

          <TabPanel value={AdminViews.Audit} sx={{ p: 0, pt: 3 }}>
            <AuditLog />
          </TabPanel>

        </TabContext>
      </ContentArea>
    </PageContainer>
  );
};

export default Admin;
