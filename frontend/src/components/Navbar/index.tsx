import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";
import { FaBars } from "react-icons/fa";
import {
  Nav,
  Logo,
  NavLink,
  MenuToggle,
  NavMenu,
  NavBtn,
  NavBtnLink,
  MobileMenu,
} from "./NavbarElement";
import api from "../../api";

const Navbar = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/logout", {});
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setAuth({});
      setMobileOpen(false);
      navigate("/");
    }
  };

  return (
    <Nav>
      <Logo>
        <img src="/auntleahslogo.svg" alt="Aunt Leah's Logo" />
      </Logo>

      <MenuToggle onClick={() => setMobileOpen(!mobileOpen)}>
        <FaBars />
      </MenuToggle>

      <NavMenu>
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/client">Client</NavLink>
        {auth.user?.role != "staff" && <NavLink to="/report">Report</NavLink>}
        {auth.user?.role == "super-admin" && <NavLink to="/admin">Admin</NavLink>}
      </NavMenu>

      <NavBtn>
        <NavBtnLink onClick={handleLogout}>Log Out</NavBtnLink>
      </NavBtn>

      <MobileMenu $open={mobileOpen}>
        <NavLink to="/home" onClick={() => setMobileOpen(false)}>
          Home
        </NavLink>
        <NavLink to="/client" onClick={() => setMobileOpen(false)}>
          Client
        </NavLink>
        {auth.user?.role != "staff" && (
          <NavLink to="/report" onClick={() => setMobileOpen(false)}>
            Report
          </NavLink>
        )}
        {auth.user?.role == "super-admin" && <NavLink to="/admin">Admin</NavLink>}
        <NavBtnLink onClick={handleLogout} style={{ marginTop: "10px" }}>
          Log Out
        </NavBtnLink>
      </MobileMenu>
    </Nav>
  );
};

export default Navbar;
