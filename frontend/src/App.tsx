import { ThemeProvider } from "@mui/material/styles";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppContainer } from "./AppElement";
import Navbar from "./components/Navbar";
import AuthContext from "./context/AuthProvider";
import GlobalStyle from "./GlobalStyles";
import muiTheme from "./theme/muiTheme";

import { useContext } from "react";
import Admin from "./pages/admin";
import Client from "./pages/client";
import ClientModal from "./pages/clientModal";
import Home from "./pages/index";
import Login from "./pages/login";
import Report from "./pages/report";

function App() {
  const { auth } = useContext(AuthContext);
  if (!auth.user) {
    return (
      <ThemeProvider theme={muiTheme}>
        <GlobalStyle />
        <Login />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <GlobalStyle />
      <AppContainer>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/home"></Navigate>} />
          <Route path="/home" element={<Home />} />
          <Route path="/client" element={<Client />}>
            <Route path=":id" element={<ClientModal />} />
          </Route>
          {auth.user?.role != "staff" && (
            <Route path="/report" element={<Report />} />
          )}
          {auth.user?.role == "super-admin" && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/home"></Navigate>} /> 
        </Routes>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
