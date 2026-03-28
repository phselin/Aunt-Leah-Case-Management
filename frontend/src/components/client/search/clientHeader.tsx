import styled from "styled-components";
import { PrimaryBtn, SecondaryBtn } from "../modal/clientElement";
import { useContext } from "react";
import AuthContext from "../../../context/AuthProvider";

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 4px;
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MainTitle = styled.h1`
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

  font-weight: 500;
  font-size: 32px;
  color: #111827;
  letter-spacing: -0.02em;
  margin: 10;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  font-weight: 400;
  font-size: 15px;
  color: #6b7280;
  margin-top: 8px;
  letter-spacing: 0.01em;
  line-height: 1.5;
  margin: 5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 0px;
`;

type Props = {
  onAdd: () => void;
  onExport: () => void;
  exporting: boolean;
};

const ClientHeader = ({ onAdd, onExport, exporting }: Props) => {
  const { auth } = useContext(AuthContext);
  return (
    <HeaderRow>
      <TitleArea>
        <MainTitle>Clients</MainTitle>
        <Subtitle>Manage and view all client information</Subtitle>
      </TitleArea>
      <ButtonGroup>
        {auth.user?.role != "staff" && (
          <SecondaryBtn onClick={onExport} disabled={exporting}>
            Export Clients
          </SecondaryBtn>
        )}
        <PrimaryBtn onClick={onAdd}>+ Add Client</PrimaryBtn>
      </ButtonGroup>
    </HeaderRow>
  );
};

export default ClientHeader;
